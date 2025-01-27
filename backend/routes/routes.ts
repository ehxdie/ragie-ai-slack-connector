const express = require('express');
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
router.post('/slack/events', (req: any, res: any) => {
    // Check if the event is for URL verification (Slack verification request)
    if (req.body.type === 'url_verification') {
        return res.status(200).send({ challenge: req.body.challenge });
    }

    // Otherwise, proceed with authentication middleware for other events
    authenticateToken;
}, slackEvents);

module.exports = router;  