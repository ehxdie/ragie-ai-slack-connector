const express = require('express');
const Routes = require('./routes/routes');
const { slackIntegration } = require("./integrations/slack");
const { ragieIntegration } = require('./integrations/ragie');
const { returnCurrentToken, saveSlackInstallationInDb } = require('./services/slackInstallationData');
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require('cors');
const debug = require('debug')('app:server');

dotenv.config();
const app = express();

// Add CORS middleware
app.use(
    cors({
        origin: ['http://localhost:5173'], // Allowed frontend origin(s)
        methods: ['GET', 'POST'], // Allowed HTTP methods
        credentials: true, // Include credentials if necessary
    })
);

app.use(express.json());
app.use(bodyParser.json());

app.use('/api', Routes);

// Function to verify token availability
async function verifyTokenAvailability(): Promise<boolean> {
    try {
        const token = await returnCurrentToken();
        if (!token) {
            throw new Error('No valid Slack token found');
        }
        debug('Slack token verified successfully');
        return true;
    } catch (error) {
        debug('Token verification failed:', error);
        return false;
    }
}



// Start the server and run initialization functions
app.listen(process.env.PORT, async () => {
    debug(`Listening on port ${process.env.PORT}...`);

    try {
        
        await verifyTokenAvailability();

        // Run Slack functionality
        debug('Initializing Slack integration...');
        await slackIntegration();

        // Run Ragie functionality
        debug('Initializing Ragie integration...');
        await ragieIntegration();

        debug('All services initialized successfully.');
    } catch (error) {
        debug('Error during initialization:', error);
        process.exit(1); // Exit the process if critical initialization fails
    }
});

module.exports = app;