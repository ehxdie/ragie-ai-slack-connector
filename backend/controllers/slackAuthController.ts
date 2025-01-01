import { Request, Response } from 'express';
const axios = require("axios");
const dotenv = require("dotenv");
const saveSlackInstallation = require("../services/slackInstallationData");
const debug = require('debug')('app:slackAuth');
dotenv.config();

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;


// Handle Slack OAuth callback
export const slackOauthCallback = async (req: Request, res: Response) => {

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
            enterpriseId: data.enterprise?.id || null,
            isEnterpriseInstall: data.is_enterprise_install,
            timestamp: Date.now()
        };



        await saveSlackInstallation(installationData);
        debug(`Slack app installed for team ${data.team.name}`);

        // Respond to the user or redirect them to a success page
        res.send(`
            <html>
                <body>
                    <h1>Slack app successfully installed!</h1>
                    <p>You will be redirected shortly...</p>
                <script>
                    setTimeout(() => {
                    window.location.href = "http://localhost:5173/";
                    }, 3000); // Redirect after 3 seconds
                </script>
                </body>
            </html>
        `);


    } catch (error: unknown) {
        debug('Error exchanging code for token:', (error as Error).message);
        res.status(500).send("Internal Server Error");
    }
};
