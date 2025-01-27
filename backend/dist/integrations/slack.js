"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { createChannel } = require('../services/database/channelService');
const { createMessage } = require('../services/database/messageService');
const { WebClient } = require('@slack/web-api');
const dotenv = require('dotenv');
const debug = require('debug')('app:slack');
const { getSlackInstallations } = require('../services/database/slackInstallationService');
const { getAllChannels } = require('../services/database/channelService');
const { uploadMessagesToRagie } = require('../integrations/ragie');
dotenv.config();
const SlackMessages = [];
async function getPublicChannels(slackClient, user) {
    try {
        const result = await slackClient.conversations.list({
            types: 'public_channel',
        });
        const publicChannels = result.channels || [];
        const ChannelInformation = [];
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
                }
                catch (error) {
                    debug(`Failed to save channel ${channel.name} to DB:`, error);
                }
            }
        }
        return ChannelInformation;
    }
    catch (error) {
        debug('Error fetching public channels:', error);
        return [];
    }
}
const messagesByUser = new Map();
async function getMessagesFromChannel(slackClient, channelId, channelName, user) {
    var _a;
    try {
        const channelObject = await getAllChannels({ slackInstallationId: user.id, channelName: channelName });
        const channel = channelObject && channelObject.length > 0 ? channelObject[0].toJSON() : null;
        const result = await slackClient.conversations.history({
            channel: channelId,
            limit: 10,
        });
        if (result.messages) {
            const channelMessages = result.messages.map((message) => ({
                user: message.user,
                text: message.text,
                ts: message.ts,
                channel: channelName,
            }));
            // Add messages to the map instead of uploading immediately
            if (!messagesByUser.has(user.userId)) {
                messagesByUser.set(user.userId, []);
            }
            (_a = messagesByUser.get(user.userId)) === null || _a === void 0 ? void 0 : _a.push(...channelMessages);
            SlackMessages.push(...channelMessages);
            // Save to database
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
                    }
                    catch (error) {
                        debug(`Failed to save message "${message.text}" to DB:`, error);
                    }
                }
            }
        }
    }
    catch (error) {
        debug(`Error fetching messages from public channel #${channelName}:`, error);
    }
}
async function slackIntegration(userID) {
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
            }
            catch (error) {
                debug('Error uploading messages to Ragie:', error);
            }
        }
        debug(`Total Messages Retrieved: ${SlackMessages.length}`);
        return SlackMessages;
    }
    catch (error) {
        debug('Error in Slack integration:', error);
        return [];
    }
}
module.exports = {
    SlackMessages,
    slackIntegration,
};
