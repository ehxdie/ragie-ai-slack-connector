export const systemPromptAnswers = [];
// Function to add an answer to the array
export const addAnswer = (answer) => {
    const timestamp = new Date().toISOString(); // Generate the current timestamp
    systemPromptAnswers.push({ answer, timestamp });
};
// Function to retrieve all answers
export const getAnswers = () => {
    return systemPromptAnswers;
};
