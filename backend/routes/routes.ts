const express = require('express');
import { NextFunction } from 'express';
const { postQuery, getResponse } = require('../controllers/ragieController');
const { slackOauthCallback } = require("../controllers/slackAuthController");
const { authenticateToken } = require('../middleware/authMiddleware');
const { slackEvents } = require('../controllers/messageController');
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
router.post('/slack/events', slackEvents);



module.exports = router;  