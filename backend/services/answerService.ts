export const systemPromptAnswers: string[] = [];

// Function to add an answer to the array
export const addAnswer = (answer: string) => {
    systemPromptAnswers.push(answer);
};

// Function to retrieve all answers
export const getAnswers = (): string[] => {
    return systemPromptAnswers;
};
