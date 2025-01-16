import { Response } from 'express';
import { IGetUserAuthInfoRequest } from '../services/database/slackInstallationService';
const dotenv = require("dotenv");
const debug = require('debug')('app:slackEvents');
const { createMessage } = require('../services/database/messageService');
const { getSlackInstallations } = require('../services/database/slackInstallationService');
const { getAllChannels } = require('../services/database/channelService');
dotenv.config();

export const slackEvents = async (req: IGetUserAuthInfoRequest, res: Response) => {

    const userID: String = req.userId;

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

            let workspaceInstallationId: number | undefined;

            try {
                // Fetch the workspace installation data using the team_id
                const workspace = await getSlackInstallations({ userId: userID });

                if (!workspace) {
                    return res.status(404).json({ error: 'Workspace installation not found' });
                }

                workspaceInstallationId = workspace.id;

                // Proceed with the rest of the logic using workspaceInstallationId
            } catch (error) {
                console.error('Error fetching workspace installation:', error);
                return res.status(500).json({ error: 'Internal server error while fetching workspace installation' });
            }

            let channelDataId: number | undefined;

            try {
                // Fetch the channel data using the channel ID
                const channelData = await getAllChannels({ workspaceInstallationId });

                if (!channelData) {
                    return res.status(404).json({ error: 'Channel data not found' });
                }

                channelDataId = channelData.id;

            } catch (error) {
                console.error('Error fetching channel data:', error);
                return res.status(500).json({ error: 'Internal server error while fetching channel data' });
            }

            // Save the message to the database
            await createMessage({
                workspaceInstallationId,
                channelDataId,
                originalSenderId: user,
                messageText: text || '',
                timestamp: parseFloat(ts),
                kafkaOffset: 0,
                processedForRag: false,
            });

            debug('Message saved to database');
        }

        res.status(200).send();
    } catch (error) {
        debug('Error handling Slack event:', error);
        res.status(500).send();
    }

}