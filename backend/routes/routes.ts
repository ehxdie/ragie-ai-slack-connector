const express = require('express');
const { postQuery, getResponse } = require('../controllers/ragieController');
const { slackOauthCallback } = require("../controllers/slackAuthController");
const { authenticateToken, requireTeamAccess } = require('../middleware/authMiddleware');
const router = express.Router();

// Public routes
router.get('/slack/install', async (req: Request, res: Response) => {
    await slackOauthCallback(req, res);
});

// Protected routes 
router.post('/', authenticateToken, postQuery);
router.get('/responses', authenticateToken,  getResponse);

module.exports = router;  