import express from 'express';

import { postQuery, getResponse } from '../controllers/ragieController.js';
import { slackOauthCallback } from "../controllers/slackAuthController.js";
const router = express.Router();


router.post('/', postQuery);
router.get('/responses', getResponse);
router.get('/slack/oauth/callback', async (req, res) => {
    await slackOauthCallback(req, res);
});

export default router;