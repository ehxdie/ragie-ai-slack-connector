import { addQuery } from '../services/queryService.js';
import { getAnswers } from '../services/answerService.js';
import { ragieIntegration } from '../integrations/ragie.js';
export const postQuery = async (req, res) => {
    
    const query = req.query.paramName;
    if (query) {
        addQuery(query);
        // Dynamically trigger the answer generation
        console.log(`Processing query: ${query}`);
        // Automatically reruns 
        await ragieIntegration();
        res.status(200).json({ msg: query });
    }
    else {
        res.status(400).json({ error: 'Query parameter not provided' });
    }
};
export const getResponse = async (req, res) => {
    const answers = getAnswers();
    if (answers) {
        res.status(200).json({ response: answers });
    }
    else {
        res.status(400).json({ error: 'No answers available' });
    }
};
// module.exports = { postQuery, getResponse }
