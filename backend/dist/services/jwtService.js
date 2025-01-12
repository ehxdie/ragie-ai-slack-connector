"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTokenFromRequest = exports.verifyToken = exports.generateToken = void 0;
const { jwt } = require('jsonwebtoken');
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
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        debug('Token verification failed:', error);
        return null;
    }
};
exports.verifyToken = verifyToken;
const extractTokenFromRequest = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
};
exports.extractTokenFromRequest = extractTokenFromRequest;
