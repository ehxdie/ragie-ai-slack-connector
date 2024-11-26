import express from 'express';
import queryRoutes from './routes/routes';
import { runAll } from "./connectors/slack.js";
import { main }  from "./index.js";

const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', queryRoutes);

// // Handles slack functionality
// runAll();

// // Handles ragie functionality
// main();

app.listen(process.env.PORT || 3000, () => {
    console.log(`Listening on port ${process.env.PORT || 3000}...`);
})