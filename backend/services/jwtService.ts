const { jwt } = require('jsonwebtoken');
import { Request } from 'express';
const debug = require('debug')('app:jwt');

// Load and validate JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    debug('JWT_SECRET is not defined in environment variables');
    throw new Error('JWT_SECRET must be defined');
}

if (JWT_SECRET.length < 32) {
    debug('JWT_SECRET is too short');
    throw new Error('JWT_SECRET must be at least 32 characters long');
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

interface TokenPayload {
    teamId: string;
    userId: string;
}


export const generateToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
        debug('Token verification failed:', error);
        return null;
    }
};

export const extractTokenFromRequest = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
};
