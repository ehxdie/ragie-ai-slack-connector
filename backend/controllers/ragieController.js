import { addQuery } from '../services/queryService';
const postQuery = async (req, res) => {
    const query = req.query.paramName;
    if (query) {
        addQuery(query);
        res.status(200).json({ msg: query });
    }
    else {
        res.status(400).json({ error: 'Query parameter not provided' });
    }
};
const getResponse = async (req, res) => {
};
module.exports = { postQuery, getResponse };
