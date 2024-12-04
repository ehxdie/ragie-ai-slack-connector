import { Request, Response } from 'express';
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:3000/api/slack/oauth/callback";


// Handle Slack OAuth callback
export const slackOauthCallback = async (req: Request, res: Response) => {

    const { code } = req.query;
    console.log(code);

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
                redirect_uri: REDIRECT_URI,
            },
        });

        const data = response.data;
        if (!data.ok) {
            return res.status(400).send(`Error from Slack: ${data.error}`);
        }

        // Extract and use data
        const { access_token, team, authed_user } = data;
        console.log(`Access Token: ${access_token}`);
        console.log(`Team: ${team.name}`);
        console.log(`Authed User: ${authed_user.id}`);

        // Respond to the user or redirect them to a success page
        res.send("Slack app successfully installed!");
    } catch (error: unknown) {
        console.error("Error exchanging code for token:", (error as Error).message);
        res.status(500).send("Internal Server Error");
    }
};
