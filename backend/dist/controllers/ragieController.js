"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const addQuery = require("../services/queryService");
const getAnswers = require("../services/answerService");
const ragieIntegration = require("../integrations/ragie");
const debug = require('debug')('app:ragieController');
// Sends user queries to Ragie
const postQuery = async (req, res) => {
    debug('Query params:', req.query);
    const query = req.query.paramName;
    if (query) {
        addQuery(query);
        debug(`Processing query: ${query}`);
        // Passing down userid into the ragieIntegration function
        const userID = req.userId;
        await ragieIntegration(userID);
        res.status(200).json({ msg: query });
    }
    else {
        res.status(400).json({ error: 'Query parameter not provided' });
    }
};
// Get responses from Ragie
const getResponse = async (req, res) => {
    const answers = getAnswers();
    if (answers) {
        res.status(200).json({ response: answers });
    }
    else {
        res.status(400).json({ error: 'No answers available' });
    }
};
module.exports = { postQuery, getResponse };
