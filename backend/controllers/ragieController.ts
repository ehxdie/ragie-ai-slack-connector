import  { Response } from 'express';
import { IGetUserAuthInfoRequest } from '../services/database/slackInstallationService';
const { addQuery } = require("../services/queryService");
const { getAnswers } = require("../services/answerService");
const { ragieIntegration } = require("../integrations/ragie");
const debug = require('debug')('app:ragieController');


// Utility type guard to check if the error is an instance of Error
const isError = (error: unknown): error is Error => {
    return error instanceof Error;
};


// Sends user queries to Ragie
const postQuery = async (req: IGetUserAuthInfoRequest, res: Response) => {
    try {
        debug('Query params:', req.query);
        const query = req.query.paramName as string;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter not provided' });
        }

        // Add the query
        await addQuery(query);
        debug(`Processing query: ${query}`);

        // Passing down userId into the ragieIntegration function
        const userID: string = req.userId;
        await ragieIntegration(userID);

        return res.status(200).json({ msg: query });
    } catch (error) {
        debug('Error in postQuery:', error);

        return res.status(500).json({
            error: 'Internal server error',
            details: isError(error) && process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get responses from Ragie
const getResponse = async (req: IGetUserAuthInfoRequest, res: Response) => {
    try {
        const answers = await getAnswers();

        if (!answers) {
            return res.status(404).json({ error: 'No answers available' });
        }

        return res.status(200).json({ response: answers });
    } catch (error) {
        debug('Error in getResponse:', error);

        return res.status(500).json({
            error: 'Internal server error',
            details: isError(error) && process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export { postQuery, getResponse };