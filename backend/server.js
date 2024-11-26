import express from 'express';
import queryRoutes from './routes/routes.js';
import cors from 'cors';
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
});
