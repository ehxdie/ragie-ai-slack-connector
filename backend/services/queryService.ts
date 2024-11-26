// stores the user queries 
export const queries: string[] = [ ]; // In-memory storage for queries

// Function to add a query to storage
export const addQuery = (query: string) => {
    queries.push(query);
}

