import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';
dotenv.config();
// Slack token 
// const token: string | null = await returnCurrentToken();
const token = 'xoxb-8170149328994-8155669495607-xv70hRKWHPJuxtaLAS8yZAjl';
console.log(token);
if (!token) {
    throw new Error('SLACK_TOKEN is not defined.');
}
// Initialize the Slack client
const slackClient = new WebClient(token);
// Store Slack messages
export const SlackMessages = [];
// Get public channels
async function getPublicChannels() {
    try {
        const result = await slackClient.conversations.list({
            types: 'public_channel'
        });
        const publicChannels = result.channels || [];
        console.log(`Total Public Channels Found: ${publicChannels.length}`);
        return publicChannels;
    }
    catch (error) {
        console.error('Error fetching public channels:', error);
        return [];
    }
}
// Get messages from a specific public channel
async function getMessagesFromChannel(channelId, channelName) {
    try {
        const result = await slackClient.conversations.history({
            channel: channelId,
            limit: 1000 // Retrieve up to 1000 messages
        });
        if (result.messages) {
            const channelMessages = result.messages.map(message => ({
                user: message.user,
                text: message.text,
                ts: message.ts,
                channel: channelName
            }));
            SlackMessages.push(...channelMessages);
            console.log(`Retrieved ${channelMessages.length} messages from #${channelName}`);
        }
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error in Slack integration:', error);
        return [];
    }
}
