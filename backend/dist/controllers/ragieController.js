"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResponse = exports.postQuery = void 0;
const { addQuery } = require("../services/queryService");
const { getAnswers } = require("../services/answerService");
const { ragieIntegration } = require("../integrations/ragie");
const debug = require('debug')('app:ragieController');
// Utility type guard to check if the error is an instance of Error
const isError = (error) => {
    return error instanceof Error;
};
// Sends user queries to Ragie
const postQuery = async (req, res) => {
    try {
        debug('Query params:', req.query);
        const query = req.query.paramName;
        if (!query) {
            return res.status(400).json({ error: 'Query parameter not provided' });
        }
        // Add the query
        await addQuery(query);
        debug(`Processing query: ${query}`);
        // Passing down userId into the ragieIntegration function
        const userID = req.userId;
        await ragieIntegration(userID);
        return res.status(200).json({ msg: query });
    }
    catch (error) {
        debug('Error in postQuery:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: isError(error) && process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.postQuery = postQuery;
// Get responses from Ragie
const getResponse = async (req, res) => {
    try {
        const answers = await getAnswers();
        if (!answers) {
            return res.status(404).json({ error: 'No answers available' });
        }
        return res.status(200).json({ response: answers });
    }
    catch (error) {
        debug('Error in getResponse:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: isError(error) && process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
exports.getResponse = getResponse;
