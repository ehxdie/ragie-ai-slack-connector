import express, { Request, Response } from 'express';
import { addQuery } from '../services/queryService';

const postQuery = async (req: Request, res: Response) => {
    const query = req.query.paramName as string;
    if (query) {
        addQuery(query);
        res.status(200).json({ msg: query });
    } else {
        res.status(400).json({ error: 'Query parameter not provided' });
    }
};

const getResponse = async (req: Request, res: Response) => {

};

module.exports = { postQuery, getResponse }