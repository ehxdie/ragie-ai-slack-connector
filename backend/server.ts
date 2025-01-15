const express = require('express');
const Routes = require('./routes/routes');
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


// Start the server and run initialization functions
app.listen(process.env.PORT, async () => {
    debug(`Listening on port ${process.env.PORT}...`);

    try {
        

        debug('All services initialized successfully.');
    } catch (error) {
        debug('Error during initialization:', error);
        process.exit(1); // Exit the process if critical initialization fails
    }
});

module.exports = app;