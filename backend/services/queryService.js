// stores the user queries 
export const queries = ["Give me a summary of all the info on the slack channel"]; // In-memory storage for queries
// Function to add a query to storage
export const addQuery = (query) => {
    queries.push(query);
};
