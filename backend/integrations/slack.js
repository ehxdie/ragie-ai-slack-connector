import { WebClient } from '@slack/web-api';
import * as fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();
// Define the full path to the 'documents' directory
const filePath = '/home/edidiong/Applications/repositories/ragie-ai-slack-connector/backend/documents/channel_messages.json';
// Make sure the parent directory exists before writing the file
const documentsDir = path.dirname(filePath);
// Ensure the 'documents' directory exists
if (!fs.existsSync(documentsDir)) {
    fs.mkdirSync(documentsDir, { recursive: true });
}
// Slack token
const token = process.env.SLACK_TOKEN;
if (!token) {
    throw new Error('SLACK_TOKEN is not defined in the environment variables.');
}
// Initialize the Slack client
const slackClient = new WebClient(token);
// Fetch channel names
async function getChannelNames() {
    try {
        const result = await slackClient.conversations.list({ types: 'public_channel' });
        if (result.channels) {
            const channelNames = result.channels.map(channel => channel.name);
            console.log('Channel Names:', channelNames);
            return channelNames;
        }
    }
    catch (error) {
        console.error('Error fetching channels:', error);
    }
}
// Get channel ID from name
async function getChannelIdByName(channelName) {
    try {
        const result = await slackClient.conversations.list();
        if (result.channels) {
            const channel = result.channels.find(c => c.name === channelName);
            if (channel)
                return channel.id;
        }
        throw new Error(`Channel with name ${channelName} not found.`);
    }
    catch (error) {
        console.error('Error fetching channel ID:', error);
    }
}
// Get messages from channel ID
async function getMessagesFromChannel(channelId) {
    try {
        const result = await slackClient.conversations.history({ channel: channelId, limit: 10 });
        if (result.messages) {
            const messagesJson = result.messages.map(message => ({
                user: message.user,
                text: message.text,
                ts: message.ts,
            }));
            fs.writeFileSync(filePath, JSON.stringify(messagesJson, null, 2));
            console.log('Messages saved to channel_messages.json');
            return messagesJson;
        }
    }
    catch (error) {
        console.error('Error fetching channel messages:', error);
    }
}
export async function slackIntegration() {
    try {
        await getChannelNames();
        const channelId = await getChannelIdByName("all-new-workspace");
        if (channelId !== undefined) {
            const channelMessages = await getMessagesFromChannel(channelId);
        }
    }
    catch (error) {
        console.error('Error in runAll:', error);
    }
}
