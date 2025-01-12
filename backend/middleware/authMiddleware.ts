import { Request, Response, NextFunction } from 'express';
const { verifyToken, extractTokenFromRequest } = require('../services/jwtService');
const debug = require('debug')('app:auth');

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const token = extractTokenFromRequest(req);
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    const payload = verifyToken(token);
    if (!payload) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Add user info to request
    req.user = payload;

    // Would call the user from the table using the user id,
    // req.user = User model from the database
    next();

};

export const requireTeamAccess = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.teamId) {
        return res.status(403).json({ error: 'Team access required' });
    }
    next();
};
