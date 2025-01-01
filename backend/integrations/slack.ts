const { returnCurrentToken } = require('../services/slackInstallationData');
const { WebClient } = require('@slack/web-api');
const dotenv = require('dotenv');
const debug = require('debug')('app:slack');

dotenv.config();

// Define types for Slack API responses
interface SlackChannel {
    id?: string;
    name?: string;
    [key: string]: any;
}

interface SlackMessage {
    user: string;
    text: string;
    ts: string;
    channel: string;
}

// Slack token 
// const token: string | null = await returnCurrentToken();
const token: string | undefined = process.env.SlACK_TOKEN;
debug('Token:', token);

if (!token) {
    throw new Error('SLACK_TOKEN is not defined.');
}

// Initialize the Slack client
const slackClient = new WebClient(token);

// Store Slack messages
const SlackMessages: SlackMessage[] = [];

// Get public channels
async function getPublicChannels(): Promise<SlackChannel[]> {
    try {
        const result = await slackClient.conversations.list({
            types: 'public_channel'
        });

        const publicChannels = result.channels || [];

        // Array to store channel id and channel name
        const ChannelInformation: SlackChannel[] = [];

        publicChannels.forEach((channel: SlackChannel) => {
            ChannelInformation.push({
                id: channel.id,
                name: channel.name,
            });
        });

        debug(`Total Public Channels Found: ${publicChannels.length}`);
        return ChannelInformation;
    } catch (error) {
        debug('Error fetching public channels:', error);
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
            debug(`Retrieved ${channelMessages.length} messages from #${channelName}`);
        }
    } catch (error) {
        debug(`Error fetching messages from public channel #${channelName}:`, error);
    }
}

// Main Slack integration function to get messages from public channels
async function slackIntegration(): Promise<SlackMessage[]> {
    try {
        // Get public channels
        const ChannelInformation = await getPublicChannels();

        // Retrieve messages from each public channel
        for (const channel of ChannelInformation) {
            if (channel.id && channel.name) {
                await getMessagesFromChannel(channel.id, channel.name);
            }
        }

        debug(`Total Messages Retrieved: ${SlackMessages.length}`);
        debug('Messages:', SlackMessages);
        return SlackMessages;
    } catch (error) {
        debug('Error in Slack integration:', error);
        return [];
    }
}

module.exports = {
    SlackMessages,
    slackIntegration
};