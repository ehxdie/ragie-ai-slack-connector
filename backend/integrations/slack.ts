import { WebClient } from '@slack/web-api';
import * as fs from 'fs';
import dotenv from 'dotenv';
import path  from 'path';

dotenv.config();


// const DIRECTORY = process.env.DIRECTORY || '/tmp';
// const filePath = path.join(DIRECTORY, 'channel_messages.json');

// if (!fs.existsSync(DIRECTORY)) {
//  fs.mkdirSync(DIRECTORY, { recursive: true });
// }

export const SlackMessages: SlackMessage[] = [];

// Slack token
const token: string | undefined = process.env.SLACK_TOKEN;

if (!token) {
    throw new Error('SLACK_TOKEN is not defined in the environment variables.');
}

// Initialize the Slack client
const slackClient = new WebClient(token);

// Define types for Slack API responses
interface SlackChannel {
    id: string;
    name: string;
}

interface SlackMessage {
    user: string;
    text: string;
    ts: string;
}

// Fetch channel names
async function getChannelNames(): Promise<string[] | undefined> {
    try {
        const result = await slackClient.conversations.list({ types: 'public_channel' });
        if (result.channels) {
            const channelNames = (result.channels as SlackChannel[]).map(channel => channel.name);
            console.log('Channel Names:', channelNames);
            return channelNames;
        }
    } catch (error) {
        console.error('Error fetching channels:', error);
    }
}

// Get channel ID from name
async function getChannelIdByName(channelName: string): Promise<string | undefined> {
    try {
        const result = await slackClient.conversations.list();
        if (result.channels) {
            const channel = (result.channels as SlackChannel[]).find(c => c.name === channelName);
            if (channel) return channel.id;
        }
        throw new Error(`Channel with name ${channelName} not found.`);
    } catch (error) {
        console.error('Error fetching channel ID:', error);
    }
}

// Get messages from channel ID
async function getMessagesFromChannel(channelId: string): Promise<SlackMessage[] | undefined> {
    try {
        const result = await slackClient.conversations.history({ channel: channelId, limit: 10 });
        if (result.messages) {
            const messagesJson = (result.messages as SlackMessage[]).map(message => ({
                user: message.user,
                text: message.text,
                ts: message.ts,
            }));
            // fs.writeFileSync(filePath, JSON.stringify(messagesJson, null, 2));
            SlackMessages.push(...messagesJson);
            console.log(SlackMessages);
            return messagesJson;
        }
    } catch (error) {
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

    } catch (error) {
        console.error('Error in runAll:', error);
    }
}