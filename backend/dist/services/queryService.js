"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// stores the user queries 
const queries = ["Give me a summary of all the info on the slack channel"]; // In-memory storage for queries
// Function to add a query to storage
const addQuery = (query) => {
    queries.push(query);
};
module.exports = {
    queries,
    addQuery
};
