"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const { verifyToken, extractTokenFromRequest } = require('../services/jwtService');
const debug = require('debug')('app:auth');
const authenticateToken = (req, res, next) => {
    const token = extractTokenFromRequest(req);
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
    // Add user info to request
    if (payload.userId) {
        // Would call the user from the table using the user id,
        // req.user = User model from the database
        req.user = payload.userId;
    }
    next();
};
exports.authenticateToken = authenticateToken;
