const Groq = require("groq-sdk");
const { queries } = require("../services/queryService");
const { addAnswer } = require("../services/answerService");
const { SlackMessages } = require("./slack");
const { getSlackInstallations } = require('../services/database/slackInstallationService');
const { getMessages, updateMessage } = require("../services/database/messageService");
const { createUserQuery } = require("../services/database/userQueries");
const dotenv = require("dotenv");
const debug = require('debug')('app:ragie');
const pLimit = require('p-limit');

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const apiKey = process.env.API_KEY;
const BATCH_SIZE = 100;
const limit = pLimit(5);

// Interfaces
interface SlackMessage {
    user: string;
    text: string;
    ts: string;
    channel: string;
}

interface SlackInstallationData {
    id: string;
    teamId: string;
    teamName: string;
    botUserId: string;
    botAccessToken: string;
    userAccessToken: string;
    userId: string;
    appId: string;
    enterpriseId?: string | null;
    isEnterpriseInstall: boolean;
    timestamp: number;
}

interface MessageData {
    id: string;
    slackInstallationId: number;
    channelId: number;
    originalSenderId: string;
    messageText: string;
    timestamp: number;
    kafkaOffset: number;
    processedForRag: boolean;
    createdAt?: Date;
}

interface RagieDocument {
    document_id: string;
    document_type: string;
    document_source: string;
    document_name: string;
    document_uploaded_at: number;
}

interface RagieChunk {
    text: string;
    score: number;
}

// Utility functions
async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 1000
): Promise<T> {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            const delay = initialDelay * Math.pow(2, i);
            debug(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}

function validateMessageText(text: string): string {
    if (!text) return "";
    return text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
}

function convertToSlackMessage(dbMessage: MessageData): SlackMessage {
    return {
        user: dbMessage.originalSenderId,
        text: validateMessageText(dbMessage.messageText),
        ts: dbMessage.timestamp.toString(),
        channel: dbMessage.channelId.toString()
    };
}

// Document management
async function uploadSlackMessagesToRagie(messages: SlackMessage[], userId: string): Promise<void> {
    try {
        const documentName = `slack_messages_${userId}.json`;

        // Get existing documents
        const existingDoc = await retryWithBackoff(async () => {
            const response = await fetch("https://api.ragie.ai/documents", {
                headers: {
                    authorization: `Bearer ${apiKey}`,
                    accept: "application/json",
                }
            });
            if (!response.ok) throw new Error(`Failed to fetch documents: ${response.status}`);
            const docs: RagieDocument[] = await response.json();
            return docs.find(doc => doc.document_name === documentName);
        });

        const documentContent = {
            messages: messages.map(msg => ({
                timestamp: msg.ts,
                user: msg.user,
                channel: msg.channel,
                content: validateMessageText(msg.text)
            })),
            metadata: {
                owner_id: userId,
                last_updated: new Date().toISOString(),
                total_messages: messages.length,
                channels: [...new Set(messages.map(msg => msg.channel))],
                users: [...new Set(messages.map(msg => msg.user))]
            }
        };

        const formData = new FormData();
        const blob = new Blob([JSON.stringify(documentContent)], { type: "application/json" });
        formData.append("file", blob, documentName);

        const url = existingDoc
            ? `https://api.ragie.ai/documents/${existingDoc.document_id}`
            : "https://api.ragie.ai/documents";

        await retryWithBackoff(async () => {
            const response = await fetch(url, {
                method: existingDoc ? "PUT" : "POST",
                headers: {
                    authorization: `Bearer ${apiKey}`,
                    accept: "application/json",
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed with status ${response.status}`);
            }
        });

        debug(`Successfully ${existingDoc ? 'updated' : 'created'} document for user ${userId} with ${messages.length} messages`);
    } catch (error) {
        debug('Error uploading messages:', JSON.stringify(error, null, 2));
        throw error;
    }
}

// Message processing
async function processSlackMessages(user: SlackInstallationData): Promise<string[]> {
    debug(`Starting to process messages for user ${user.userId}...`);
    try {
        const dbMessagesObject = await getMessages({
            slackInstallationId: user.id,
            processedForRag: false
        });
        debug(` dbMessagesObject ${dbMessagesObject} `);

        // Check if dbMessagesObject is an array or a single object
        let dbMessages: MessageData[] = [];

        if (Array.isArray(dbMessagesObject)) {
            // If it's an array, map over it to extract MessageData objects
            dbMessages = dbMessagesObject.map((message: any) => message.toJSON());
        } else if (dbMessagesObject) {
            // If it's a single object, wrap it in an array
            dbMessages = [dbMessagesObject.toJSON()];
        }

        debug(`All dbmessages ${dbMessages}`);

        if (dbMessages.length === 0) {
            debug(`No new messages found for user ${user.userId}`);
            return [];
        }

        const batches = [];
        for (let i = 0; i < dbMessages.length; i += BATCH_SIZE) {
            batches.push(dbMessages.slice(i, i + BATCH_SIZE));
        }

        const processedMessageIds: string[] = [];

        await Promise.all(batches.map(async batch => {
            const slackMessages = batch.map(msg => convertToSlackMessage(msg));

            await limit(async () => {
                await uploadSlackMessagesToRagie(slackMessages, user.userId);
                await Promise.all(batch.map(msg =>
                    updateMessage(msg.id, { processedForRag: true })
                ));
                processedMessageIds.push(...batch.map(msg => msg.id));
            });
        }));

        debug(`Finished processing ${dbMessages.length} messages for user ${user.userId}`);
        return processedMessageIds;
    } catch (error) {
        debug('Error processing messages:', JSON.stringify(error, null, 2));
        throw error;
    }
}

// Retrieval
async function retrieveChunks(query: string, userId: string): Promise<string> {
    return retryWithBackoff(async () => {
        const response = await fetch("https://api.ragie.ai/retrievals", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                query,
                filters: {
                    document_name: `slack_messages_${userId}.json`,
                    scope: "tutorial"
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to retrieve data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.scored_chunks
            .slice(0, 5)
            .map((chunk: RagieChunk) => chunk.text)
            .join(" ")
            .slice(0, 1000);
    });
}

function generateSystemPrompt(chunkText: string, userId: string): string {
    return `You are "Ragie AI", a professional but friendly AI chatbot assisting user ${userId}.
Your responses should be based on the context provided below.
Here is the relevant context:
===
${chunkText}
===
END CONTEXT`;
}

async function getGroqChatCompletion(systemPrompt: string, userQuery: string) {
    return retryWithBackoff(() =>
        groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuery },
            ],
            model: "llama3-8b-8192",
            temperature: 0.5,
            max_tokens: 256,
            top_p: 1,
            stop: null,
            stream: false,
        })
    );
}

// Main integration
async function ragieIntegration(userID: string): Promise<void> {
    try {
        const userObject = await getSlackInstallations({ userId: userID });
        if (!userObject?.length) {
            throw new Error(`No installation found for user ${userID}`);
        }

        const user = userObject[0].toJSON();
        const processedMessageIds = await processSlackMessages(user);
        const latestQuery = queries[queries.length - 1];

        if (!latestQuery?.trim()) {
            throw new Error('No valid query found');
        }

        const chunkText = await retrieveChunks(latestQuery, user.userId);
        const systemPrompt = generateSystemPrompt(chunkText, user.userId);
        const chatCompletion:any = await getGroqChatCompletion(systemPrompt, latestQuery);
        const completionContent = chatCompletion.choices[0]?.message?.content || "";

        await createUserQuery({
            slackInstallationId: user.id,
            userSlackId: user.userId,
            queryText: latestQuery,
            responseText: completionContent,
            referencedMessageIds: processedMessageIds,
            createdAt: new Date(),
        });

        debug('Generated completion:', completionContent);
        addAnswer(completionContent);
    } catch (error) {
        debug('Error during Ragie integration:', JSON.stringify(error, null, 2));
        throw error;
    }
}

module.exports = {
    ragieIntegration,
    uploadSlackMessagesToRagie,
    processSlackMessages,
    retrieveChunks,
    generateSystemPrompt,
    getGroqChatCompletion
};