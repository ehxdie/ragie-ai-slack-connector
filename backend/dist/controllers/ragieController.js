"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const addQuery = require("../services/queryService");
const getAnswers = require("../services/answerService");
const ragieIntegration = require("../integrations/ragie");
const debug = require('debug')('app:ragieController');
const postQuery = async (req, res) => {
    debug('Query params:', req.query);
    const query = req.query.paramName;
    if (query) {
        addQuery(query);
        debug(`Processing query: ${query}`);
        await ragieIntegration();
        res.status(200).json({ msg: query });
    }
    else {
        res.status(400).json({ error: 'Query parameter not provided' });
    }
};
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
