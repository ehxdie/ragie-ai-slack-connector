const Groq = require("groq-sdk");
const { queries } = require("../services/queryService");
const { addAnswer } = require("../services/answerService");
const { SlackMessages } = require("./slack");
const { getSlackInstallations } = require('../services/database/slackInstallationService');
const { getMessages, updateMessage } = require("../services/database/messageService");
const { createUserQuery } = require("../services/database/userQueries");
const dotenv = require("dotenv");
const debug = require('debug')('app:ragie');


dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const apiKey = process.env.API_KEY;

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

/**
 * Uploads all Slack messages as a single document to Ragie.
 * @param messages - Array of Slack messages to upload.
 */

async function uploadSlackMessagesToRagie(messages: SlackMessage[]): Promise<void> {
    try {
        // Validate messages is an array
        if (!Array.isArray(messages)) {
            throw new Error('Messages must be an array');
        }

        debug(messages);

        // Create a structured document containing all messages
        const documentContent = {
            messages: messages.map(msg => ({
                timestamp: msg.ts,
                user: msg.user,
                channel: msg.channel,
                content: msg.text
            })),
            totalMessages: messages.length,
            channels: [...new Set(messages.map(msg => msg.channel))],
            users: [...new Set(messages.map(msg => msg.user))]
        };

        const formData = new FormData();
        const blob = new Blob([JSON.stringify(documentContent)], { type: "application/json" });
        formData.append("file", blob, "slack_messages.json");

        const response = await fetch("https://api.ragie.ai/documents", {
            method: "POST",
            headers: {
                authorization: `Bearer ${apiKey}`,
                accept: "application/json",
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
        }

        debug(`Successfully uploaded ${messages.length} messages as a single document`);
    } catch (error) {
        debug('Error uploading messages:', error);
        throw error;
    }
}

/**
 * Processes Slack messages and uploads them to Ragie.
*/

function convertToSlackMessage(dbMessage: any): SlackMessage {
    return {
        user: dbMessage.originalSenderId,
        text: dbMessage.messageText,
        ts: dbMessage.timestamp.toString(), // Convert to seconds for Slack format
        channel: dbMessage.channelId.toString()
    };
}


async function processSlackMessages(user: SlackInstallationData): Promise<string[] | void> {
    debug(`Starting to process messages for user ${user.userId}...`);
    try {
        // Get all messages for this user from the database
        const dbMessagesObject = await getMessages({
            slackInstallationId: user.id,
            processedForRag: false  // Only get messages not yet processed
        });

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
            return;
        }

        // Convert database messages to SlackMessage format
        const slackMessages: SlackMessage[] = [];
        for (const dbMessage of dbMessages) {
            slackMessages.push(convertToSlackMessage(dbMessage));
        }

        // Get the IDs of processed messages
        const processedMessageIds: string[] = [];
        for (const msg of dbMessages) {
            processedMessageIds.push(msg.id);
        }

        // Upload messages to Ragie
        await uploadSlackMessagesToRagie(slackMessages);

        // Update messages as processed
        for (const msg of dbMessages) {
            await updateMessage(msg.id, { processedForRag: true });
        }

        debug(`Finished processing ${slackMessages.length} messages for user ${user.userId}`);

        return processedMessageIds;
    } catch (error) {
        debug(`Error processing messages for user ${user.userId}:`, error);
        throw error;
    }
}


/**
 * Retrieves chunks based on the user's latest query.
 * @param query - The query string to retrieve chunks for.
 * @returns A formatted string containing retrieved chunks.
 */

async function retrieveChunks(query: string, userId: string): Promise<string> {
    try {
        const response = await fetch("https://api.ragie.ai/retrievals", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                query, filters: {
                    scope: "tutorial",
                    userId: userId
                } }),
        });

        if (!response.ok) {
            throw new Error(
                `Failed to retrieve data: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();
        const chunkText = data.scored_chunks.map((chunk: any) => chunk.text);
        return chunkText.slice(0, 5).join(" ").slice(0, 1000);
    } catch (error) {
        debug('Error retrieving chunks:', error);
        return "";
    }
}

/**
 * Generates the system prompt using retrieved chunks.
 * @param chunkText - The text extracted from chunks.
 * @returns A formatted system prompt string.
 */

function generateSystemPrompt(chunkText: string, userId: string): string {
    return `You are "Ragie AI", a professional but friendly AI chatbot assisting user ${userId}...
Here is all the information:
===
${chunkText}
===
END SYSTEM INSTRUCTIONS`;
}

/**
 * Sends a chat completion request to the Groq API.
 * @param systemPrompt - The system prompt to guide the AI.
 * @param userQuery - The user's query.
 * @returns The chat completion response.
 */

async function getGroqChatCompletion(systemPrompt: string, userQuery: string) {
    return groq.chat.completions.create({
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
    });
}

/**
 * Main function to handle the Ragie integration.
 */

async function ragieIntegration(userID: string): Promise<void> {
    try {
        // Getting the current token from the database
        const userObject = await getSlackInstallations({ userId: userID });
        const user: SlackInstallationData = userObject && userObject.length > 0 ? userObject[0].toJSON() : null;

        // Process messages and get their IDs
        const processedMessageIds = await processSlackMessages(user);
        const latestQuery = queries[queries.length - 1]
        const chunkText = await retrieveChunks(latestQuery, user.userId);
        const systemPrompt = generateSystemPrompt(chunkText, user.userId);
        const chatCompletion = await getGroqChatCompletion(systemPrompt, latestQuery);
        const completionContent = chatCompletion.choices[0]?.message?.content || "";

        // Store the query and response in the UserQueries database
        await createUserQuery({
            slackInstallationId: user.id,
            userSlackId: user.userId,
            queryText: latestQuery,
            responseText: completionContent,
            referencedMessageIds: processedMessageIds || [],
            createdAt: new Date(),
        });

        debug('Generated completion:', completionContent);
        addAnswer(completionContent);
    } catch (error) {
        debug('Error during Ragie integration:', error);
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