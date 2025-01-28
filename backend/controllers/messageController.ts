import { Response } from 'express';
import { IGetUserAuthInfoRequest } from '../services/database/slackInstallationService';
const dotenv = require("dotenv");
const debug = require('debug')('app:slackEvents');
const { createMessage } = require('../services/database/messageService');
const { getSlackInstallations } = require('../services/database/slackInstallationService');
const { getAllChannels, getChannelInfo } = require('../services/database/channelService');

dotenv.config();

const apiKey = process.env.API_KEY;
// Add new document management function

interface SlackMessage {
    user: string;
    text: string;
    ts: string;
    channel: string;
}

async function uploadMessagesToRagie(messages: SlackMessage[], userId: string): Promise<void> {
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
            .then(docs => docs.find((doc: any) => doc?.document_name === documentName));

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
    } catch (error) {
        debug('Error uploading messages:', error);
        throw error;
    }
}

export const slackEvents = async (req: IGetUserAuthInfoRequest, res: Response) => {

    const userID: string = req.userId;

    debug('INCOMING SLACK EVENT - Raw request:', {
        body: req.body,
        headers: req.headers,
        method: req.method,
        path: req.path
    });

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

            let slackInstallationId: number | undefined;
            let botAccessToken: string | undefined;

            try {
                // Fetch the workspace installation data using the userId
                const workspace = await getSlackInstallations({ userId: userID });
                debug('Workspace:', workspace);
                if (!workspace) {
                    return res.status(404).json({ error: 'Workspace installation not found' });
                }
                const installation = workspace[0];
                slackInstallationId = installation.dataValues.id;
                botAccessToken = installation.dataValues.botAccessToken;
                 
            } catch (error) {
                debug('Error fetching workspace installation:', error);
                return res.status(500).json({ error: 'Internal server error while fetching workspace installation' });
            }


            // Getting channel name and channel ID
            // Example usage
            const channelId = req.body.event.channel;
            
            const channelInfo = await getChannelInfo(channelId, botAccessToken);
            debug('Channel info:', channelInfo);
            const channelName: String = channelInfo?.name;

            // Getting channel id from the channel name
            let channelDataId: number | undefined;

            try {
                // Fetch the channel data using the channel name
                const channelData = await getAllChannels({ channelName });
                debug('Channel data:', channelData);

                if (!channelData) {
                    return res.status(404).json({ error: 'Channel data not found' });
                }

                const installation = channelData[0];
                channelDataId = installation.dataValues.id;
                debug('Channel data:', channelDataId);

            } catch (error) {
                debug('Error fetching channel data:', error);
                return res.status(500).json({ error: 'Internal server error while fetching channel data' });
            }

            const messageData = {
                slackInstallationId,
                channelId:channelDataId,
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
            } catch (error) {
                debug('Error uploading message to Ragie:', error);
            }
        }

        res.status(200).send();
    } catch (error) {
        debug('Error handling Slack event:', error);
        res.status(500).send();
    }
};