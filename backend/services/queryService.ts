// stores the user queries 
export const queries: string[] = ["Give me a summary of all the info on the slack channel"]; // In-memory storage for queries
//export const queries: string[] = [];


// Function to add a query to storage
export const addQuery = (query: string) => {
    queries.push(query);
}

