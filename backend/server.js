import express from 'express';
import Routes from './routes/routes.js';
import { slackIntegration } from "./integrations/slack.js";
import { ragieIntegration } from './integrations/ragie.js';
import bodyParser from "body-parser";
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use('/api', Routes);
// Start the server and run initialization functions
app.listen(process.env.PORT, async () => {
    console.log(`Listening on port ${process.env.PORT}...`);
    try {
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
