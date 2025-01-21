"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
// Utility functions
async function retryWithBackoff(operation, maxRetries = 3, initialDelay = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            const delay = initialDelay * Math.pow(2, i);
            debug(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}
function validateMessageText(text) {
    if (!text)
        return "";
    return text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
}
function convertToSlackMessage(dbMessage) {
    return {
        user: dbMessage.originalSenderId,
        text: validateMessageText(dbMessage.messageText),
        ts: dbMessage.timestamp.toString(),
        channel: dbMessage.channelId.toString()
    };
}
// Document management
async function uploadSlackMessagesToRagie(messages, userId) {
    try {
        const documentName = `slack_messages_${userId}.json`;
        // Get existing documents with error handling for response format
        const existingDoc = await retryWithBackoff(async () => {
            const response = await fetch("https://api.ragie.ai/documents", {
                headers: {
                    authorization: `Bearer ${apiKey}`,
                    accept: "application/json",
                }
            });
            debug(`ragie response:${response}`);
            if (!response.ok)
                throw new Error(`Failed to fetch documents: ${response.status}`);
            const data = await response.json();
            // Handle both array and object response formats
            const docs = Array.isArray(data) ? data : data.documents || [];
            return docs.find((doc) => (doc === null || doc === void 0 ? void 0 : doc.document_name) === documentName);
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
                const errorText = await response.text();
                throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
            }
            // Log success response
            const responseData = await response.json();
            debug('Upload response:', JSON.stringify(responseData, null, 2));
        });
        debug(`Successfully ${existingDoc ? 'updated' : 'created'} document for user ${userId} with ${messages.length} messages`);
    }
    catch (error) {
        debug('Error uploading messages:', error instanceof Error ? error.stack : JSON.stringify(error, null, 2));
        throw error;
    }
}
// Message processing
async function processSlackMessages(user) {
    debug(`Starting to process messages for user ${user.userId}...`);
    try {
        const dbMessagesObject = await getMessages({
            slackInstallationId: user.id,
            processedForRag: false
        });
        debug(` dbMessagesObject ${dbMessagesObject} `);
        // Handle various response formats
        let dbMessages = [];
        if (Array.isArray(dbMessagesObject)) {
            dbMessages = dbMessagesObject.map(message => typeof message.toJSON === 'function' ? message.toJSON() : message);
        }
        else if (dbMessagesObject && typeof dbMessagesObject === 'object') {
            if (typeof dbMessagesObject.toJSON === 'function') {
                dbMessages = [dbMessagesObject.toJSON()];
            }
            else {
                dbMessages = [dbMessagesObject];
            }
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
        const processedMessageIds = [];
        await Promise.all(batches.map(async (batch) => {
            const slackMessages = batch.map(msg => convertToSlackMessage(msg));
            await limit(async () => {
                await uploadSlackMessagesToRagie(slackMessages, user.userId);
                await Promise.all(batch.map(msg => updateMessage(msg.id, { processedForRag: true })));
                processedMessageIds.push(...batch.map(msg => msg.id));
            });
        }));
        debug(`Finished processing ${dbMessages.length} messages for user ${user.userId}`);
        return processedMessageIds;
    }
    catch (error) {
        debug('Error processing messages:', JSON.stringify(error, null, 2));
        throw error;
    }
}
// Retrieval
async function retrieveChunks(query, userId) {
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
            .map((chunk) => chunk.text)
            .join(" ")
            .slice(0, 1000);
    });
}
function generateSystemPrompt(chunkText, userId) {
    return `You are "Ragie AI", a professional but friendly AI chatbot assisting user ${userId}.
Your responses should be based on the context provided below.
Here is the relevant context:
===
${chunkText}
===
END CONTEXT`;
}
async function getGroqChatCompletion(systemPrompt, userQuery) {
    return retryWithBackoff(() => groq.chat.completions.create({
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
    }));
}
// Main integration
async function ragieIntegration(userID) {
    var _a, _b;
    try {
        const userObject = await getSlackInstallations({ userId: userID });
        if (!(userObject === null || userObject === void 0 ? void 0 : userObject.length)) {
            throw new Error(`No installation found for user ${userID}`);
        }
        const user = userObject[0].toJSON();
        const processedMessageIds = await processSlackMessages(user);
        const latestQuery = queries[queries.length - 1];
        if (!(latestQuery === null || latestQuery === void 0 ? void 0 : latestQuery.trim())) {
            throw new Error('No valid query found');
        }
        const chunkText = await retrieveChunks(latestQuery, user.userId);
        const systemPrompt = generateSystemPrompt(chunkText, user.userId);
        const chatCompletion = await getGroqChatCompletion(systemPrompt, latestQuery);
        const completionContent = ((_b = (_a = chatCompletion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || "";
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
    }
    catch (error) {
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
