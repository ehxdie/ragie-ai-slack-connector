"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const systemPromptAnswers = [];
// Function to add an answer to the array
const addAnswer = (answer) => {
    const timestamp = new Date().toISOString(); // Generate the current timestamp
    systemPromptAnswers.push({ answer, timestamp });
};
// Function to retrieve all answers
const getAnswers = () => {
    return systemPromptAnswers;
};
module.exports = {
    systemPromptAnswers,
    addAnswer,
    getAnswers
};
