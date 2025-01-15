import { Request, Response, NextFunction } from 'express';
import { IGetUserAuthInfoRequest } from '../services/database/slackInstallationService';
const { verifyToken, extractTokenFromRequest } = require('../services/jwtService');
const debug = require('debug')('app:auth');

export const authenticateToken = (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
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
        req.userId = payload.userId
    }
    
    next();

};

