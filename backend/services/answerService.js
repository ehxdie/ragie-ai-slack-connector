export const systemPromptAnswers = [];
// Function to add an answer to the array
export const addAnswer = (answer) => {
    systemPromptAnswers.push(answer);
};
// Function to retrieve all answers
export const getAnswers = () => {
    return systemPromptAnswers;
};
