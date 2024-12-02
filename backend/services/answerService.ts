export const systemPromptAnswers: { answer: string; timestamp: string }[] = [];

// Function to add an answer to the array
export const addAnswer = (answer: string) => {
    const timestamp = new Date().toISOString(); // Generate the current timestamp
    systemPromptAnswers.push({ answer, timestamp });
};

// Function to retrieve all answers
export const getAnswers = (): { answer: string; timestamp: string }[] => {
    return systemPromptAnswers;
};