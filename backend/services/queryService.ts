// stores the user queries 
export const queries: string[] = [ "Give me a summary of the channel conversations", "Add some extra context to the conversations" ]; // In-memory storage for queries

// Function to add a query to storage
export const addQuery = (query: string) => {
    queries.push(query);
}

