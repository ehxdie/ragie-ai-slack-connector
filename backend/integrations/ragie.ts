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

interface WorkspaceMetadata {
    owner_id: string;
    last_updated: string;
    total_messages: number;
    channels: string[];
    users: string[];
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

async function uploadMessagesToRagie(messages: SlackMessage[], userId: string): Promise<WorkspaceMetadata> {
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

        const metadata: WorkspaceMetadata = {
            owner_id: userId,
            last_updated: new Date().toISOString(),
            total_messages: messages.length,
            channels: [...new Set(messages.map(msg => msg.channel))],
            users: [...new Set(messages.map(msg => msg.user))]
        };

        const documentContent = {
            messages: messages.map(msg => ({
                timestamp: msg.ts,
                user: msg.user,
                channel: msg.channel,
                content: msg.text
            })),
            metadata
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
        return metadata;
    } catch (error) {
        debug('Error uploading messages:', error);
        throw error;
    }
}

async function retrieveChunks(query: string, userId: string): Promise<{ chunks: string; metadata: WorkspaceMetadata }> {
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
                    document_name: `slack_messages_${userId}.json`
                }
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to retrieve data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const chunks = data.scored_chunks
            .slice(0, 10)  // Increased from 5 to 10 chunks
            .map((chunk: RagieChunk) => chunk.text)
            .join("\n\n")  // Better separation between chunks
            .slice(0, 2000);  // Increased from 1000 to 2000 characters

        // Get the metadata from the document
        const metadataResponse = await fetch(`https://api.ragie.ai/documents/${data.document_id}`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        if (!metadataResponse.ok) {
            throw new Error(`Failed to retrieve metadata: ${metadataResponse.status}`);
        }

        const documentData = await metadataResponse.json();
        return {
            chunks,
            metadata: documentData.metadata
        };
    });
}

function generateSystemPrompt(chunkText: string, userId: string, metadata: WorkspaceMetadata): string {
    return `You are "Ragie AI", a professional but friendly AI chatbot assisting user ${userId}.
Your responses should be based on the workspace information and context provided below.

Workspace Information:
- Total Messages: ${metadata.total_messages}
- Total Channels: ${metadata.channels.length}
- Channel List: ${metadata.channels.join(', ')}
- Total Users: ${metadata.users.length}
- Last Updated: ${metadata.last_updated}

When answering questions about the workspace structure (channels, users, messages),
always refer to this metadata first as it provides the most accurate information.

Context from messages:
===
${chunkText}
===
END CONTEXT

Remember to:
1. Use the workspace information above for questions about channels, users, and message counts
2. Use the context for specific message content and conversations
3. Always be accurate with numbers and statistics from the workspace information`;
}

async function getGroqChatCompletion(systemPrompt: string, userQuery: string) {
    return retryWithBackoff(() =>
        groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuery },
            ],
            model: "llama3-8b-8192",
            temperature: 0.2,  // Lowered from 0.5 for more factual responses
            max_tokens: 1024,
            top_p: 0.9,  // Adjusted from 1.0
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

        const { chunks, metadata } = await retrieveChunks(latestQuery, user.userId);
        const systemPrompt = generateSystemPrompt(chunks, user.userId, metadata);
        const chatCompletion: any = await getGroqChatCompletion(systemPrompt, latestQuery);
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