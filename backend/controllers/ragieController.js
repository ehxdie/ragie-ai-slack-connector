import { addQuery } from '../services/queryService.js';
import { getAnswers } from '../services/answerService.js';
export const postQuery = async (req, res) => {
    const query = req.query.paramName;
    if (query) {
        addQuery(query);
        res.status(200).json({ msg: query });
    }
    else {
        res.status(400).json({ error: 'Query parameter not provided' });
    }
};
export const getResponse = async (req, res) => {
    const answers = getAnswers();
    res.status(200).json({ answers });
};
// module.exports = { postQuery, getResponse }
