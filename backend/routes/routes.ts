import { Request, Response, NextFunction } from 'express';
import { IGetUserAuthInfoRequest } from '../services/database/slackInstallationService';
const express = require('express');
const { postQuery, getResponse } = require('../controllers/ragieController');
const { slackOauthCallback } = require("../controllers/slackAuthController");
const { authenticateToken } = require('../middleware/authMiddleware');
const { slackEvents } = require('../controllers/messageController');
const { getSlackInstallations } = require('../services/database/slackInstallationService');
const debug = require("debug")("slack:routes"); // Debug namespace
const router = express.Router();

// Public routes
router.get('/slack/install', async (req: Request, res: Response) => {
    await slackOauthCallback(req, res);
});

// Protected routes 
router.post('/', authenticateToken, postQuery);
router.get('/responses', authenticateToken,  getResponse);

// router.post('/slack/events', (req: any, res: any, next: NextFunction) => {
//     // Check if the event is for URL verification (Slack verification request)
//     if (req.body.type === 'url_verification') {
//         return res.status(200).send({ challenge: req.body.challenge });
//     }

//     // For all other events, apply authentication and continue to event handler
//     authenticateToken(req, res, () => {
//         slackEvents(req, res, next);
//     });
// });
// router.post('/slack/events', authenticateToken, slackEvents);

router.post('/slack/events', async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    debug('Received Slack event:', req.body?.type);

    // Handle URL verification without authentication
    if (req.body.type === 'url_verification') {
        return res.status(200).json({ challenge: req.body.challenge });
    }

    debug('Checking for request body:', req.body);

    // For actual events, get the team_id from the Slack event
    const teamId = req.body?.team_id;
    debug('Team ID from event:', teamId);

    try {
        // Find the installation using team_id
        const installations = await getSlackInstallations({ teamId: teamId });

        if (!installations || installations.length === 0) {
            debug('No installation found for team:', teamId);
            return res.status(404).json({ error: 'Installation not found' });
        }

        // Get the first installation (assuming one team = one installation)
        const installation = installations[0];

        // Add the userId to the request object
        req.userId = installation.userId;
        debug('Added user ID to request:', req.userId);

        // Now call the events handler
        await slackEvents(req, res);
    } catch (error) {
        debug('Error processing Slack event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



module.exports = router;  