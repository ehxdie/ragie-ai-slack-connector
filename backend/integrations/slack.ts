const { createChannel } = require('../services/database/channelService');
const { createMessage } = require('../services/database/messageService');
const { WebClient } = require('@slack/web-api');
const dotenv = require('dotenv');
const debug = require('debug')('app:slack');
const { getSlackInstallations } = require('../services/database/slackInstallationService');
const { getAllChannels } = require('../services/database/channelService');
const { uploadMessagesToRagie } = require('../integrations/ragie');

dotenv.config();


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

interface Channel {
    id: number;
    slackInstallationId: number;
    channelName: string;
    createdAt: Date;
}




const SlackMessages: SlackMessage[] = [];

async function getPublicChannels(slackClient: any, user: SlackInstallationData): Promise<SlackChannel[]> {
    try {
        const result = await slackClient.conversations.list({
            types: 'public_channel',
        });

        const publicChannels = result.channels || [];
        const ChannelInformation: SlackChannel[] = [];

        for (const channel of publicChannels) {
            if (channel.id && channel.name) {
                try {
                    ChannelInformation.push({
                        id: user.id,
                        channelId: channel.id,
                        name: channel.name,
                    });

                    await createChannel({
                        slackInstallationId: user.id,
                        channelName: channel.name,
                    });
                } catch (error) {
                    debug(`Failed to save channel ${channel.name} to DB:`, error);
                }
            }
        }

        return ChannelInformation;
    } catch (error) {
        debug('Error fetching public channels:', error);
        return [];
    }
}

const messagesByUser: Map<string, SlackMessage[]> = new Map();

async function getMessagesFromChannel(
    slackClient: any,
    channelId: string,
    channelName: string,
    user: SlackInstallationData
) {
    try {
        const channelObject = await getAllChannels({
            slackInstallationId: user.id,
            channelName: channelName
        });
        const channel: Channel = channelObject?.length > 0 ? channelObject[0].toJSON() : null;

        let allMessages: any[] = [];
        let nextCursor: string | undefined = undefined;

        do {
            const result: any = await slackClient.conversations.history({
                channel: channelId,
                limit: 200,  // Max limit per request
                cursor: nextCursor,
            });

            if (result.messages) {
                const channelMessages = result.messages.map((message: any) => ({
                    user: message.user,
                    text: message.text,
                    ts: message.ts,
                    channel: channelName,
                }));

                // Store messages
                allMessages.push(...channelMessages);
                if (!messagesByUser.has(user.userId)) {
                    messagesByUser.set(user.userId, []);
                }
                messagesByUser.get(user.userId)?.push(...channelMessages);
                SlackMessages.push(...channelMessages);

                // Save messages to database
                for (const message of result.messages) {
                    if (message.user && message.text && message.ts) {
                        try {
                            await createMessage({
                                slackInstallationId: user.id,
                                channelId: channel.id,
                                originalSenderId: message.user,
                                messageText: message.text,
                                timestamp: parseFloat(message.ts),
                                kafkaOffset: 0,
                                processedForRag: true,
                            });
                            debug(`Message saved to DB: ${message.text}`);
                        } catch (error) {
                            debug(`Failed to save message "${message.text}" to DB:`, error);
                        }
                    }
                }
            }

            nextCursor = result.response_metadata?.next_cursor; // Update cursor for next request
        } while (nextCursor); // Continue until no more messages to fetch

        debug(`Fetched ${allMessages.length} messages from #${channelName}`);
    } catch (error) {
        debug(`Error fetching messages from channel #${channelName}:`, error);
    }
}


async function slackIntegration(userID: string): Promise<SlackMessage[]> {
    try {
        const userObject = await getSlackInstallations({ userId: userID });
        debug(`All User: ${userObject}`);

        const user = userObject && userObject.length > 0 ? userObject[0].toJSON() : null;
        debug(`User: ${JSON.stringify(user)}`);

        if (!user || !user.botAccessToken) {
            debug(`user: ${JSON.stringify(user)}`);
            throw new Error('User or token not found.');
        }

        const slackClient = new WebClient(user.botAccessToken);
        const ChannelInformation = await getPublicChannels(slackClient, user);

        // Clear any existing messages for this user
        messagesByUser.delete(user.userId);

        // Fetch messages from all channels
        for (const channel of ChannelInformation) {
            if (channel.channelId && channel.name) {
                await getMessagesFromChannel(slackClient, channel.channelId, channel.name, user);
            }
        }

        // Upload all messages for this user at once
        const userMessages = messagesByUser.get(user.userId) || [];
        if (userMessages.length > 0) {
            try {
                debug(`Uploading ${userMessages} messages to Ragie for user ${user.userId}`);
                await uploadMessagesToRagie(userMessages, user.userId);
                debug(`Uploaded ${userMessages.length} messages to Ragie for user ${user.userId}`);
            } catch (error) {
                debug('Error uploading messages to Ragie:', error);
            }
        }

        debug(`Total Messages Retrieved: ${SlackMessages.length}`);
        return SlackMessages;
    } catch (error) {
        debug('Error in Slack integration:', error);
        return [];
    }
}

module.exports = {
    SlackMessages,
    slackIntegration,
};