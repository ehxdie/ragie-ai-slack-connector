import express, { Request, Response } from 'express';
import { addQuery } from '../services/queryService.js';
import {  getAnswers } from '../services/answerService.js';

export const postQuery = async (req: Request, res: Response) => {
    const query = req.query.paramName as string;
    if (query) {
        addQuery(query);
        res.status(200).json({ msg: query });
    } else {
        res.status(400).json({ error: 'Query parameter not provided' });
    }
};

export const getResponse = async (req: Request, res: Response) => {
    const answers = getAnswers();
    if (answers) {
        res.status(200).json({ answers });
    } else {
        res.status(400).json({ error: 'No answers available' });
    }
    
};

// module.exports = { postQuery, getResponse }