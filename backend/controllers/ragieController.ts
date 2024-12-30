import  { Request, Response } from 'express';
const addQuery = require("../services/queryService");
const getAnswers = require("../services/answerService");
const ragieIntegration = require("../integrations/ragie");


const postQuery = async (req: Request, res: Response) => {
    console.log(req.query);
    const query = req.query.paramName as string;
    if (query) {
        addQuery(query);
        // Dynamically trigger the answer generation
        console.log(`Processing query: ${query}`);
        // Automatically reruns 
        await ragieIntegration();
        res.status(200).json({ msg: query });
    } else {
        res.status(400).json({ error: 'Query parameter not provided' });
    }
};

const getResponse = async (req: Request, res: Response) => {
    const answers = getAnswers();
    if (answers) {
        res.status(200).json({ response: answers });
    } else {
        res.status(400).json({ error: 'No answers available' });
    }
    
};

module.exports = { postQuery, getResponse }