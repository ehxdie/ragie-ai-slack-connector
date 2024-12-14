import Groq from "groq-sdk";
import { queries } from "../services/queryService.js";
import { addAnswer } from '../services/answerService.js';
import { SlackMessages } from "./slack.js";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const apiKey = process.env.API_KEY;

interface SlackMessage {
    user: string;
    text: string;
    ts: string;
    channel: string;
}

// Assume SlackMessages is already an array of SlackMessage
const files: SlackMessage[] = SlackMessages;

// Loading Slack data into Ragie
for (const message of files) {
    const formData = new FormData();
    const blob = new Blob([JSON.parse(message.text)], { type: 'application/json' });
    formData.append("file", blob, `${message.ts}.json`);
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
    } else {
        console.log(`Message ${message.ts} uploaded successfully.`);
    }
}

// Retrieving chunks

// Get the user's latest query
const query = queries[queries.length - 1];

const response = await fetch("https://api.ragie.ai/retrievals", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, filters: { scope: "tutorial" } }),
});

if (!response.ok) {
    console.error(
        `Failed to retrieve data from Ragie API: ${response.status} ${response.statusText}`
    );
    process.exit(1);
}

const data = await response.json();
const chunkText = data.scored_chunks.map((chunk: any) => chunk.text);

const limitedChunkText = chunkText.slice(0, 5).join(" ").slice(0, 1000); // Limit chunks
const systemPrompt = `You are "Ragie AI", a professional but friendly AI chatbot...
Here is all the information:
===
${limitedChunkText}
===
END SYSTEM INSTRUCTIONS`;

export async function ragieIntegration() {
    const chatCompletion = await getGroqChatCompletion();

    // Print the completion returned by the LLM
    console.log(chatCompletion.choices[0]?.message?.content || "");

    // Send the generated answer to the services folder
    addAnswer(chatCompletion.choices[0]?.message?.content || "");
}

export const getGroqChatCompletion = async () => {
    return groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: systemPrompt,
            },
            {
                role: "user",
                content: queries[queries.length - 1],
            },
        ],
        model: "llama3-8b-8192",
        temperature: 0.5,
        max_tokens: 256,
        top_p: 1,
        stop: null,
        stream: false,
    });
};



