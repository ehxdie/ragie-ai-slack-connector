"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const Routes = require('./routes/routes');
const { slackIntegration } = require("./integrations/slack");
const { ragieIntegration } = require('./integrations/ragie');
const { returnCurrentToken, saveSlackInstallationInDb } = require('./services/slackInstallationData');
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require('cors');
dotenv.config();
const app = express();
// Add CORS middleware
app.use(cors({
    origin: ['http://localhost:5173'], // Allowed frontend origin(s)
    methods: ['GET', 'POST'], // Allowed HTTP methods
    credentials: true, // Include credentials if necessary
}));
app.use(express.json());
app.use(bodyParser.json());
app.use('/api', Routes);
// Function to verify token availability
async function verifyTokenAvailability() {
    try {
        const token = await returnCurrentToken();
        if (!token) {
            throw new Error('No valid Slack token found');
        }
        console.log('Slack token verified successfully');
        return true;
    }
    catch (error) {
        console.error('Token verification failed:', error);
        return false;
    }
}
const testdata = {
    teamId: 'T07QVM5HEM9',
    teamName: 'Buildr',
    botUserId: 'U0821VBJY92',
    botAccessToken: 'xoxb-7845719592723-8069997644308-G9LbKaQgKyTW6anTS2z4lehd',
    userAccessToken: 'xoxp-7845719592723-7848341665476-8182548043665-060711dd19bf723d66b6e3b779dd822b',
    userId: 'U07QYA1KKE0',
    appId: 'A082C47GC01',
    scopes: { botScopes: [Array], userScopes: [Array] },
    enterpriseId: null,
    isEnterpriseInstall: false,
    timestamp: 1735504807626
};
// Start the server and run initialization functions
app.listen(process.env.PORT, async () => {
    console.log(`Listening on port ${process.env.PORT}...`);
    try {
        // Verify token availability first
        // const isTokenAvailable = await verifyTokenAvailability();
        // if (!isTokenAvailable) {
        //     console.error('Cannot proceed with integrations due to token unavailability');
        //     process.exit(1);
        // }
        await saveSlackInstallationInDb(testdata);
        // Run Slack functionality
        console.log('Initializing Slack integration...');
        await slackIntegration();
        // Run Ragie functionality
        console.log('Initializing Ragie integration...');
        await ragieIntegration();
        console.log('All services initialized successfully.');
    }
    catch (error) {
        console.error('Error during initialization:', error);
        process.exit(1); // Exit the process if critical initialization fails
    }
});
module.exports = app;
