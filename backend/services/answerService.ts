const systemPromptAnswers: { answer: string; timestamp: string }[] = [];

// Function to add an answer to the array
const addAnswer = (answer: string): void => {
    const timestamp = new Date().toISOString(); // Generate the current timestamp
    systemPromptAnswers.push({ answer, timestamp });
};

// Function to retrieve all answers
const getAnswers = (): { answer: string; timestamp: string }[] => {
    return systemPromptAnswers;
};

module.exports = {
    systemPromptAnswers,
    addAnswer,
    getAnswers
};