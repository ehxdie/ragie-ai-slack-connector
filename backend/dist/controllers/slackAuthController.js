"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slackOauthCallback = void 0;
const axios = require("axios");
const dotenv = require("dotenv");
const { createSlackInstallation } = require("../services/database/slackInstallationService");
const { slackIntegration } = require("../integrations/slack");
const { generateToken } = require('../services/jwtService');
const debug = require('debug')('app:slackAuth');
dotenv.config();
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
// Handle Slack OAuth callback
const slackOauthCallback = async (req, res) => {
    var _a;
    const { code } = req.query;
    debug('Auth code:', code);
    if (!code) {
        return res.status(400).send("Authorization code not found!");
    }
    try {
        // Exchange code for access token
        const response = await axios.post("https://slack.com/api/oauth.v2.access", null, {
            params: {
                client_id: SLACK_CLIENT_ID,
                client_secret: SLACK_CLIENT_SECRET,
                code: code,
                redirect_uri: "https://ragie-ai-slack-connector-9yhn.onrender.com/api/slack/install"
            },
        });
        const data = response.data;
        if (!data.ok) {
            return res.status(400).send(`Error from Slack: ${data.error}`);
        }
        debug('OAuth response data:', data);
        // Extract and use data
        const { access_token, team, authed_user } = data;
        debug(`Access Token: ${access_token}`);
        debug(`Team: ${team.name}`);
        debug(`Authed User: ${authed_user.id}`);
        // Extract key information
        const installationData = {
            teamId: data.team.id,
            teamName: data.team.name,
            botUserId: data.bot_user_id,
            botAccessToken: data.access_token,
            userAccessToken: data.authed_user.access_token,
            userId: data.authed_user.id,
            appId: data.app_id,
            enterpriseId: ((_a = data.enterprise) === null || _a === void 0 ? void 0 : _a.id) || null,
            isEnterpriseInstall: data.is_enterprise_install,
            timestamp: Date.now()
        };
        // Stores slack installation data to the data
        try {
            await createSlackInstallation(installationData);
            debug(`Slack app installed for team ${data.team.name}`);
        }
        catch (error) {
            debug(`Slack installation failed for team ${data.team.name} error :${error}`);
        }
        // Generate JWT token after successful installation
        let token;
        try {
            token = generateToken({
                teamId: installationData.teamId,
                userId: installationData.userId
            });
        }
        catch (error) {
            debug('Error generating JWT token:', error);
            return res.status(500).send("Failed to generate JWT token");
        }
        // Handles slack integration, saving messages to the database 
        try {
            debug('Initializing Slack integration...');
            await slackIntegration(installationData.userId);
        }
        catch (error) {
            debug(`Slack initiation error error :${error}`);
        }
        // Send HTML response with localStorage script
        res.send(`
    <html>
        <body>
            <h1>Slack app successfully installed!</h1>
            <p>Storing credentials...</p>
            <script>
                try {
                    // Store the token
                    localStorage.setItem('ragie_token', '${token}');
                    console.log('Token stored successfully');
                    
                    // Also store in sessionStorage as backup
                    sessionStorage.setItem('ragie_token', '${token}');
                    
                    // Add a flag to indicate fresh installation
                    localStorage.setItem('fresh_install', 'true');
                    
                    window.location.href = 'http://localhost:5173/?token=${token}';
                } catch (error) {
                    console.error('Failed to store token:', error);
                    // Redirect with error parameter
                    window.location.href = 'http://localhost:5173/error?message=token_storage_failed';
                }
            </script>
        </body>
    </html>
`);
    }
    catch (error) {
        debug('Error exchanging code for token:', error);
        res.status(500).send("Internal Server Error");
    }
};
exports.slackOauthCallback = slackOauthCallback;
