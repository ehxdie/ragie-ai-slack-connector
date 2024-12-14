// import { WebClient } from '@slack/web-api';
// import dotenv from 'dotenv';


// dotenv.config();


// export const SlackMessages: SlackMessage[] = [];

// // Slack token
// const token: string | undefined = process.env.SLACK_TOKEN;

// if (!token) {
//     throw new Error('SLACK_TOKEN is not defined in the environment variables.');
// }

// // Initialize the Slack client
// const slackClient = new WebClient(token);

// // Define types for Slack API responses
// interface SlackChannel {
//     id: string;
//     name: string;
// }

// interface SlackMessage {
//     user: string;
//     text: string;
//     ts: string;
// }

// // Fetch channel names
// async function getChannelNames(): Promise<string[] | undefined> {
//     try {
//         const result = await slackClient.conversations.list({ types: 'public_channel' });
//         if (result.channels) {
//             const channelNames = (result.channels as SlackChannel[]).map(channel => channel.name);
//             console.log('Channel Names:', channelNames);
//             return channelNames;
//         }
//     } catch (error) {
//         console.error('Error fetching channels:', error);
//     }
// }

// // Get channel ID from name
// async function getChannelIdByName(channelName: string): Promise<string | undefined> {
//     try {
//         const result = await slackClient.conversations.list();
//         if (result.channels) {
//             const channel = (result.channels as SlackChannel[]).find(c => c.name === channelName);
//             if (channel) return channel.id;
//         }
//         throw new Error(`Channel with name ${channelName} not found.`);
//     } catch (error) {
//         console.error('Error fetching channel ID:', error);
//     }
// }

// // Get messages from channel ID
// async function getMessagesFromChannel(channelId: string): Promise<SlackMessage[] | undefined> {
//     try {
//         const result = await slackClient.conversations.history({ channel: channelId, limit: 10 });
//         if (result.messages) {
//             const messagesJson = (result.messages as SlackMessage[]).map(message => ({
//                 user: message.user,
//                 text: message.text,
//                 ts: message.ts,
//             }));
            
//             SlackMessages.push(...messagesJson);
//             console.log(SlackMessages);
//             return messagesJson;
//         }
//     } catch (error) {
//         console.error('Error fetching channel messages:', error);
//     }
// }


// export async function slackIntegration() {
//     try {
//         await getChannelNames();
//         const channelId = await getChannelIdByName("all-new-workspace");

//         if (channelId !== undefined) {
//             const channelMessages = await getMessagesFromChannel(channelId);
//         }   

//     } catch (error) {
//         console.error('Error in runAll:', error);
//     }
// }
import { returnCurrentToken } from '../services/slackInstallationData';
import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';

dotenv.config();

// Define types for Slack API responses
interface SlackChannel {
    id: string;
    name: string;
}

interface SlackMessage {
    user: string;
    text: string;
    ts: string;
    channel: string;
}

// Slack token 

const token: string | null = await returnCurrentToken();

if (!token) {
    throw new Error('SLACK_TOKEN is not defined.');
}

// Initialize the Slack client
const slackClient = new WebClient(token);

// Store Slack messages
export const SlackMessages: SlackMessage[] = [];

// Get public channels
async function getPublicChannels(): Promise<SlackChannel[]> {
    try {
        const result = await slackClient.conversations.list({
            types: 'public_channel'
        });

        const publicChannels = result.channels || [];
        console.log(`Total Public Channels Found: ${publicChannels.length}`);
        return publicChannels as SlackChannel[];
    } catch (error) {
        console.error('Error fetching public channels:', error);
        return [];
    }
}

// Get messages from a specific public channel
async function getMessagesFromChannel(channelId: string, channelName: string): Promise<void> {
    try {
        const result = await slackClient.conversations.history({
            channel: channelId,
            limit: 1000  // Retrieve up to 1000 messages
        });

        if (result.messages) {
            const channelMessages = (result.messages as any[]).map(message => ({
                user: message.user,
                text: message.text,
                ts: message.ts,
                channel: channelName
            }));

            SlackMessages.push(...channelMessages);
            console.log(`Retrieved ${channelMessages.length} messages from #${channelName}`);
        }
    } catch (error) {
        console.error(`Error fetching messages from public channel #${channelName}:`, error);
    }
}

// Main Slack integration function to get messages from public channels
export async function slackIntegration() {
    try {
        // Get public channels
        const publicChannels = await getPublicChannels();

        // Retrieve messages from each public channel
        for (const channel of publicChannels) {
            await getMessagesFromChannel(channel.id, channel.name);
        }

        console.log(`Total Messages Retrieved: ${SlackMessages.length}`);
        return SlackMessages;
    } catch (error) {
        console.error('Error in Slack integration:', error);
        return [];
    }
}

