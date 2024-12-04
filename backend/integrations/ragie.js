import { readFile } from "node:fs/promises";
import fs from "fs";
import path from 'path';
import Groq from "groq-sdk";
import { queries } from "../services/queryService.js";
import { addAnswer } from '../services/answerService.js';
import dotenv from "dotenv";
dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const apiKey = process.env.API_KEY;
const directory = process.env.DIRECTORY || '/tmp/documents';
if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
}
const files = fs.readdirSync(directory);
// Loading slack data into ragie
for (const file of files) {
    const filePath = path.join(directory, file);
    const blob = new Blob([await readFile(filePath)]);
    const formData = new FormData();
    formData.append("file", blob, file);
    formData.append("metadata", JSON.stringify({ title: file, scope: "tutorial" }));
    const response = await fetch("https://api.ragie.ai/documents", {
        method: "POST",
        headers: {
            authorization: `Bearer ${apiKey}`,
            accept: "application/json",
        },
        body: formData,
    });
    if (!response.ok) {
        throw new Error("Upload failed");
    }
}
// Retrieving chunks 
// Getting users latest query
const query = queries[queries.length - 1];
const response = await fetch("https://api.ragie.ai/retrievals", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({ query, filters: { scope: "tutorial" } }),
});
if (!response.ok) {
    console.error(`Failed to retrieve data from Ragie API: ${response.status} ${response.statusText}`);
    process.exit(1);
}
// Setting up generation 
// ${chunkText}
const data = await response.json();
const chunkText = data.scored_chunks.map((chunk) => chunk.text);
// const limitedChunkText = chunkText.slice(0, 5);
// const systemPrompt = `These are very important to follow:
// You are "Ragie AI", a professional but friendly AI chatbot working as an assitant to the user.
// Your current task is to help the user based on all of the information available to you shown below.
// Answer informally, directly, and concisely without a heading or greeting but include everything relevant.
// Use richtext Markdown when appropriate including bold, italic, paragraphs, and lists when helpful.
// If using LaTeX, use double $$ as delimiter instead of single $. Use $$...$$ instead of parentheses.
// Organize information into multiple sections or points when appropriate.
// Don't include raw item IDs or other raw fields from the source.
// Don't use XML or other markup unless requested by the user.
// Here is all of the information available to answer the user:
// ===
// ${limitedChunkText.join("\n")}
// ===
// If the user asked for a search and there are no results, make sure to let the user know that you couldn't find anything,
// and what they might be able to do to find the information they need.
// END SYSTEM INSTRUCTIONS`;
const limitedChunkText = chunkText.slice(0, 5).join(" ").slice(0, 1000); // Limit chunks
const systemPrompt = `You are "Ragie AI", a professional but friendly AI chatbot...
Here is all the information:
===
${limitedChunkText}
===
END SYSTEM INSTRUCTIONS`;
export async function ragieIntegration() {
    const chatCompletion = await getGroqChatCompletion();
    // Print the completion returned by the LLM.
    console.log(chatCompletion.choices[0]?.message?.content || "");
    // Sends the generated answer to the services folder
    addAnswer(chatCompletion.choices[0]?.message?.content || "");
}
export const getGroqChatCompletion = async () => {
    return groq.chat.completions.create({
        //
        // Required parameters
        //
        messages: [
            // Set an optional system message. This sets the behavior of the
            // assistant and can be used to provide specific instructions for
            // how it should behave throughout the conversation.
            {
                role: "system",
                content: systemPrompt,
            },
            // Set a user message for the assistant to respond to.
            {
                role: "user",
                content: queries[queries.length - 1],
            },
        ],
        // The language model which will generate the completion.
        model: "llama3-8b-8192",
        temperature: 0.5,
        // max_tokens: 1024,
        max_tokens: 256,
        top_p: 1,
        stop: null,
        stream: false,
    });
};
