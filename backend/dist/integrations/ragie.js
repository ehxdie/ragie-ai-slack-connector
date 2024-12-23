import Groq from "groq-sdk";
import { queries } from "../services/queryService.js";
import { addAnswer } from "../services/answerService.js";
import { SlackMessages } from "./slack.js";
import dotenv from "dotenv";
import { console } from "inspector";
dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const apiKey = process.env.API_KEY;
/**
 * Uploads all Slack messages as a single document to Ragie.
 * @param messages - Array of Slack messages to upload.
 */
async function uploadSlackMessagesToRagie(messages) {
    try {
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
        console.log(`Successfully uploaded ${messages.length} messages as a single document`);
    }
    catch (error) {
        console.error("Error uploading messages:", error);
        throw error;
    }
}
/**
 * Processes Slack messages and uploads them to Ragie.
 */
async function processSlackMessages() {
    console.log("Starting to process messages...");
    await uploadSlackMessagesToRagie(SlackMessages);
    console.log("Finished processing messages");
}
/**
 * Retrieves chunks based on the user's latest query.
 * @param query - The query string to retrieve chunks for.
 * @returns A formatted string containing retrieved chunks.
 */
async function retrieveChunks(query) {
    try {
        const response = await fetch("https://api.ragie.ai/retrievals", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ query, filters: { scope: "tutorial" } }),
        });
        if (!response.ok) {
            throw new Error(`Failed to retrieve data: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const chunkText = data.scored_chunks.map((chunk) => chunk.text);
        return chunkText.slice(0, 5).join(" ").slice(0, 1000);
    }
    catch (error) {
        console.error("Error retrieving chunks:", error);
        return "";
    }
}
/**
 * Generates the system prompt using retrieved chunks.
 * @param chunkText - The text extracted from chunks.
 * @returns A formatted system prompt string.
 */
function generateSystemPrompt(chunkText) {
    return `You are "Ragie AI", a professional but friendly AI chatbot...
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
async function getGroqChatCompletion(systemPrompt, userQuery) {
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
export async function ragieIntegration() {
    try {
        // Process all Slack messages as a single document
        await processSlackMessages();
        // Check if there are any queries
        if (!queries || queries.length === 0) {
            console.log('No queries available to process');
            return;
        }
        // Check if there are any Slack messages
        if (!SlackMessages || SlackMessages.length === 0) {
            console.log('No Slack messages available to process');
            return;
        }
        console.log('Processing query:', queries[queries.length - 1]);
        // Retrieve and process chunks
        const latestQuery = queries[queries.length - 1];
        const chunkText = await retrieveChunks(latestQuery);
        console.log('Retrieved chunk text length:', chunkText.length);
        const systemPrompt = generateSystemPrompt(chunkText);
        // Generate a chat completion
        const chatCompletion = await getGroqChatCompletion(systemPrompt, latestQuery);
        // Log the completion content
        const completionContent = chatCompletion.choices[0]?.message?.content || "";
        console.log('Generated completion:', completionContent);
        // Save the answer
        addAnswer(completionContent);
    }
    catch (error) {
        console.error("Error during Ragie integration:", error);
        throw error; // Rethrow to ensure the error is properly handled
    }
}
