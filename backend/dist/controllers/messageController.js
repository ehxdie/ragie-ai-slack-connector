"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slackEvents = void 0;
const dotenv = require("dotenv");
const debug = require('debug')('app:slackEvents');
const { createMessage } = require('../services/database/messageService');
const { getSlackInstallations } = require('../services/database/slackInstallationService');
const { getAllChannels } = require('../services/database/channelService');
dotenv.config();
const apiKey = process.env.API_KEY;
async function uploadMessagesToRagie(messages, userId) {
    try {
        const documentName = `slack_messages_${userId}.json`;
        // Get existing documents
        const existingDoc = await fetch("https://api.ragie.ai/documents", {
            headers: {
                authorization: `Bearer ${apiKey}`,
                accept: "application/json",
            }
        })
            .then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed to fetch documents: ${res.status}`)))
            .then(data => Array.isArray(data) ? data : data.documents || [])
            .then(docs => docs.find((doc) => (doc === null || doc === void 0 ? void 0 : doc.document_name) === documentName));
        const documentContent = {
            messages: messages.map(msg => ({
                timestamp: msg.ts,
                user: msg.user,
                channel: msg.channel,
                content: msg.text
            })),
            metadata: {
                owner_id: userId,
                last_updated: new Date().toISOString(),
                total_messages: messages.length,
                channels: [...new Set(messages.map(msg => msg.channel))],
                users: [...new Set(messages.map(msg => msg.user))]
            }
        };
        const formData = new FormData();
        const blob = new Blob([JSON.stringify(documentContent)], { type: "application/json" });
        formData.append("file", blob, documentName);
        const url = existingDoc
            ? `https://api.ragie.ai/documents/${existingDoc.document_id}`
            : "https://api.ragie.ai/documents";
        const response = await fetch(url, {
            method: existingDoc ? "PUT" : "POST",
            headers: {
                authorization: `Bearer ${apiKey}`,
                accept: "application/json",
            },
            body: formData,
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
        }
        debug(`Successfully ${existingDoc ? 'updated' : 'created'} document for user ${userId}`);
    }
    catch (error) {
        debug('Error uploading messages:', error);
        throw error;
    }
}
const slackEvents = async (req, res) => {
    const userID = req.userId;
    try {
        const { type, challenge, event } = req.body;
        // Handle Slack URL verification
        if (type === 'url_verification') {
            return res.status(200).send({ challenge });
        }
        // Handle new message event
        if (type === 'event_callback' && event.type === 'message') {
            const { channel, user, text, ts } = event;
            debug(`New message in channel ${channel}: ${text}`);
            let slackInstallationId;
            try {
                // Fetch the workspace installation data using the userId
                const workspace = await getSlackInstallations({ userId: userID });
                if (!workspace) {
                    return res.status(404).json({ error: 'Workspace installation not found' });
                }
                slackInstallationId = workspace.id;
            }
            catch (error) {
                debug('Error fetching workspace installation:', error);
                return res.status(500).json({ error: 'Internal server error while fetching workspace installation' });
            }
            let channelDataId;
            try {
                // Fetch the channel data using the channel ID
                const channelData = await getAllChannels({ slackInstallationId });
                if (!channelData) {
                    return res.status(404).json({ error: 'Channel data not found' });
                }
                channelDataId = channelData.id;
            }
            catch (error) {
                debug('Error fetching channel data:', error);
                return res.status(500).json({ error: 'Internal server error while fetching channel data' });
            }
            const messageData = {
                slackInstallationId,
                channelDataId,
                originalSenderId: user,
                messageText: text || '',
                timestamp: parseFloat(ts),
                kafkaOffset: 0,
                processedForRag: false,
            };
            // Save the message to the database
            await createMessage(messageData);
            debug('Message saved to database');
            // Update or create document in Ragie
            try {
                const slackMessage = {
                    ts,
                    user,
                    channel,
                    text,
                };
                await uploadMessagesToRagie([slackMessage], userID);
            }
            catch (error) {
                debug('Error uploading message to Ragie:', error);
            }
        }
        res.status(200).send();
    }
    catch (error) {
        debug('Error handling Slack event:', error);
        res.status(500).send();
    }
};
exports.slackEvents = slackEvents;
