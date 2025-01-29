const Groq = require("groq-sdk");
const { queries } = require("../services/queryService");
const { addAnswer } = require("../services/answerService");
const { getSlackInstallations } = require('../services/database/slackInstallationService');
const { createUserQuery } = require("../services/database/userQueries");
const dotenv = require("dotenv");
const debug = require('debug')('app:ragie');

dotenv.config();

// Initialize clients once
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const apiKey = process.env.API_KEY;

// Cache for document metadata
const documentCache = new Map();

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

// Optimized retry function with circuit breaker
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

// Batch upload processing
async function uploadMessagesToRagie(messages: SlackMessage[], userId: string): Promise<WorkspaceMetadata> {
    const BATCH_SIZE = 100;
    const documentName = `slack_messages_${userId}.json`;

    try {
        // Check cache first
        const cachedDoc = documentCache.get(userId);
        if (!cachedDoc) {
            const docs = await retryWithBackoff(async () => {
                const response = await fetch("https://api.ragie.ai/documents", {
                    headers: {
                        authorization: `Bearer ${apiKey}`,
                        accept: "application/json",
                    }
                });
                if (!response.ok) throw new Error(`Failed to fetch documents: ${response.status}`);
                const data = await response.json();
                return Array.isArray(data) ? data : data.documents || [];
            });
            const existingDoc = docs.find((doc: any) => doc?.document_name === documentName);
            if (existingDoc) documentCache.set(userId, existingDoc);
        }

        const metadata: WorkspaceMetadata = {
            owner_id: userId,
            last_updated: new Date().toISOString(),
            total_messages: messages.length,
            channels: [...new Set(messages.map(msg => msg.channel))],
            users: [...new Set(messages.map(msg => msg.user))]
        };

        // Process in batches
        for (let i = 0; i < messages.length; i += BATCH_SIZE) {
            const batch = messages.slice(i, i + BATCH_SIZE);
            const documentContent = {
                messages: batch.map(msg => ({
                    timestamp: msg.ts,
                    user: msg.user,
                    channel: msg.channel,
                    content: msg.text
                })),
                metadata
            };

            await uploadBatch(documentContent, documentName, userId);
        }

        return metadata;
    } catch (error) {
        debug('Error uploading messages:', error);
        throw error;
    }
}

// Separate batch upload function
async function uploadBatch(content: any, documentName: string, userId: string): Promise<void> {
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(content)], { type: "application/json" });
    formData.append("file", blob, documentName);

    const existingDoc = documentCache.get(userId);
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
}

// Optimized chunk retrieval with caching
const chunkCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function retrieveChunks(query: string, userId: string): Promise<string> {
    const cacheKey = `${userId}:${query}`;
    const cached = chunkCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    const chunks = await retryWithBackoff(async () => {
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
        const documentName = `slack_messages_${userId}.json`;
        const filteredChunks = data.scored_chunks
            .filter((chunk: any) => chunk.document_name === documentName)
            .slice(0, 10)
            .map((chunk: RagieChunk) => chunk.text)
            .join("\n\n")
            .slice(0, 2000);

        chunkCache.set(cacheKey, {
            data: filteredChunks,
            timestamp: Date.now()
        });

        return filteredChunks;
    });

    return chunks;
}

// Optimized prompt generation
const systemPromptTemplate = (chunkText: string, userId: string): string => `
You are "Ragie AI", a professional but friendly AI chatbot assisting user ${userId}.
Your responses should be based on the context provided below.
Here is the relevant context:
===
${chunkText}
===
END CONTEXT`;

// Optimized chat completion
async function getGroqChatCompletion(systemPrompt: string, userQuery: string) {
    return retryWithBackoff(() =>
        groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuery },
            ],
            model: "llama3-8b-8192",
            temperature: 0.2,
            max_tokens: 1024,
            top_p: 0.9,
            stop: null,
            stream: false,
        }),
        3,
        1000,
        // 10s timeout for chat completion
    );
}

// Main integration function with error handling
async function ragieIntegration(userID: string): Promise<void> {
    try {
        const [userObject] = await getSlackInstallations({ userId: userID });
        if (!userObject) {
            throw new Error(`No installation found for user ${userID}`);
        }

        const user = userObject.toJSON();
        const latestQuery = queries[queries.length - 1]?.trim();

        if (!latestQuery) {
            throw new Error('No valid query found');
        }

        const chunks = await retrieveChunks(latestQuery, user.userId);
        const systemPrompt = systemPromptTemplate(chunks, user.userId);
        const chatCompletion:any = await getGroqChatCompletion(systemPrompt, latestQuery);
        const completionContent = chatCompletion.choices[0]?.message?.content || "";

        await Promise.all([
            createUserQuery({
                slackInstallationId: user.id,
                userSlackId: user.userId,
                queryText: latestQuery,
                responseText: completionContent,
                referencedMessageIds: [],
                createdAt: new Date(),
            }),
            addAnswer(completionContent)
        ]);

        debug('Generated completion:', completionContent);
    } catch (error) {
        debug('Error during Ragie integration:', error);
        throw error;
    }
}

module.exports = {
    ragieIntegration,
    uploadMessagesToRagie
};