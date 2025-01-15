import  { Response } from 'express';
import { IGetUserAuthInfoRequest } from '../services/database/slackInstallationService';
const addQuery = require("../services/queryService");
const getAnswers = require("../services/answerService");
const ragieIntegration = require("../integrations/ragie");
const debug = require('debug')('app:ragieController');

// Sends user queries to Ragie
const postQuery = async (req: IGetUserAuthInfoRequest, res: Response) => { 
    debug('Query params:', req.query);
    const query = req.query.paramName as string;
    if (query) {
        addQuery(query);
        debug(`Processing query: ${query}`);
        // Passing down userid into the ragieIntegration function
        const userID: String = req.userId;
        await ragieIntegration(userID);
        res.status(200).json({ msg: query });
    } else {
        res.status(400).json({ error: 'Query parameter not provided' });
    }
};

// Get responses from Ragie
const getResponse = async (req: IGetUserAuthInfoRequest, res: Response) => {
    const answers = getAnswers();
    if (answers) {
        res.status(200).json({ response: answers });
    } else {
        res.status(400).json({ error: 'No answers available' });
    }
    
};

module.exports = { postQuery, getResponse }