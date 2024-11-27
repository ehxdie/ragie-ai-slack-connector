import express from 'express';
import { postQuery, getResponse } from '../controllers/ragieController.js';
const router = express.Router();
router.post('/', postQuery);
router.get('/responses', getResponse);
export default router;
