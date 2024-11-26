import express from 'express';
const { postQuery, getResponse } = require('../Controllers/ragieController');
const router = express.Router();
router.get('/:reply', getResponse);
router.post('/:query', postQuery);
export default router;
