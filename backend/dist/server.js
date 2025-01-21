"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const Routes = require('./routes/routes');
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require('cors');
const debug = require('debug')('app:server');
dotenv.config();
const app = express();
// Add CORS middleware
app.use(cors({
    origin: 'http://localhost:5173', // Frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    credentials: true, // Include credentials if needed (e.g., cookies, auth)
}));
app.use(express.json());
app.use(bodyParser.json());
app.use('/api', Routes);
// Start the server and run initialization functions
app.listen(process.env.PORT, (error) => {
    if (error) {
        debug('Error during server startup:', error);
        process.exit(1); // Exit the process if there's an error
    }
    else {
        debug(`Listening on port ${process.env.PORT}...`);
    }
});
module.exports = app;
