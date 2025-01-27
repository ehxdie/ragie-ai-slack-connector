const Groq = require("groq-sdk");
const { queries } = require("../services/queryService");
const { addAnswer } = require("../services/answerService");
const { getSlackInstallations } = require('../services/database/slackInstallationService');
const { createUserQuery } = require("../services/database/userQueries");
const dotenv = require("dotenv");
const debug = require('debug')('app:ragie');

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const apiKey = process.env.API_KEY;

interface RagieChunk {
    text: string;
    score: number;
}

interface SlackMessage {
    user: string;
    text: string;
    ts: string;
    channel: string;
}



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

// Add new document management function
async function uploadMessagesToRagie(messages: SlackMessage[], userId: string): Promise<void> {
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
            const data = await response.json();
            const docs = Array.isArray(data) ? data : data.documents || [];
            return docs.find((doc: any) => doc?.document_name === documentName);
        });

        const documentContent = {
            messages: messages.map(msg => ({
                timestamp: msg.ts,
                user: msg.user,
                channel: msg.channel,
                content: msg.text
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
                const errorText = await response.text();
                throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
            }
        });

        debug(`Successfully ${existingDoc ? 'updated' : 'created'} document for user ${userId}`);
    } catch (error) {
        debug('Error uploading messages:', error);
        throw error;
    }
}

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
            max_tokens: 1024,
            top_p: 1,
            stop: null,
            stream: false,
        })
    );
}

async function ragieIntegration(userID: string): Promise<void> {
    try {
        const userObject = await getSlackInstallations({ userId: userID });
        if (!userObject?.length) {
            throw new Error(`No installation found for user ${userID}`);
        }

        const user = userObject[0].toJSON();
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
            referencedMessageIds: [],
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
    uploadMessagesToRagie
};