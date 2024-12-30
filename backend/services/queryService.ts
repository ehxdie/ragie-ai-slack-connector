// stores the user queries 
const queries: string[] = ["Give me a summary of all the info on the slack channel"]; // In-memory storage for queries

// Function to add a query to storage
const addQuery = (query: string): void => {
    queries.push(query);
};

module.exports = {
    queries,
    addQuery
};