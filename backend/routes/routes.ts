const express = require('express');
const { postQuery, getResponse } = require('../controllers/ragieController');
const { slackOauthCallback } = require("../controllers/slackAuthController");
const router = express.Router();

router.post('/', postQuery);
router.get('/responses', getResponse);
router.get('/slack/install', async (req: Request, res: Response) => {
    await slackOauthCallback(req, res);
});

module.exports = router;  // Changed from export default to module.exports