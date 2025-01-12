const { db } = require("../../db/models");
const debug = require("debug")("userquery:crud"); // Debug namespace
const UserQuery = db.UserQuery;

interface UserQueryData {
    workspaceInstallationId: number;
    userSlackId: string;
    queryText: string;
    responseText: string;
    referencedMessageIds: number[];
    createdAt?: Date;
}

/**
 * Create a new UserQuery.
 * @param {UserQueryData} data - UserQuery attributes
 * @returns {Promise<object>} The created UserQuery instance
 */

const createUserQuery = async (data: UserQueryData) => {
    debug("Creating a new UserQuery with data: %O", data);
    try {
        const query = await UserQuery.create(data);
        debug("Created UserQuery: %O", query);
        return query;
    } catch (error) {
        debug("Error creating UserQuery: %O", error);
        throw error;
    }
};

/**
 * Fetch all UserQueries or find by criteria.
 * @param {object} [criteria={}] - Search filters
 * @returns {Promise<object[]>} Array of UserQuery instances
 */

const getUserQueries = async (criteria = {}) => {
    debug("Fetching UserQueries with criteria: %O", criteria);
    try {
        const queries = await UserQuery.findAll({ where: criteria });
        debug("Fetched UserQueries: %O", queries);
        return queries;
    } catch (error) {
        debug("Error fetching UserQueries: %O", error);
        throw error;
    }
};

/**
 * Fetch a specific UserQuery by ID.
 * @param {number} id - UserQuery ID
 * @returns {Promise<object|null>} The UserQuery instance, or null if not found
 */

const getUserQueryById = async (id: number) => {
    debug("Fetching UserQuery by ID: %d", id);
    try {
        const query = await UserQuery.findByPk(id);
        if (!query) {
            debug("No UserQuery found for ID: %d", id);
        } else {
            debug("Fetched UserQuery: %O", query);
        }
        return query;
    } catch (error) {
        debug("Error fetching UserQuery by ID: %O", error);
        throw error;
    }
};

/**
 * Update a UserQuery record.
 * @param {number} id - ID of the UserQuery to update
 * @param {Partial<UserQueryData>} data - Data to update
 * @returns {Promise<object|null>} The updated UserQuery instance, or null if not found
 */
const updateUserQuery = async (id: number, data: Partial<UserQueryData>) => {
    debug("Updating UserQuery with ID: %d and data: %O", id, data);
    try {
        const query = await UserQuery.findByPk(id);
        if (!query) {
            debug("No UserQuery found for ID: %d", id);
            return null;
        }
        await query.update(data);
        debug("Updated UserQuery: %O", query);
        return query;
    } catch (error) {
        debug("Error updating UserQuery: %O", error);
        throw error;
    }
};

/**
 * Delete a UserQuery record.
 * @param {number} id - ID of the UserQuery to delete
 * @returns {Promise<boolean>} True if deleted successfully, false otherwise
 */

const deleteUserQuery = async (id: number) => {
    debug("Deleting UserQuery with ID: %d", id);
    try {
        const query = await UserQuery.findByPk(id);
        if (!query) {
            debug("No UserQuery found for ID: %d", id);
            return false;
        }
        await query.destroy();
        debug("Deleted UserQuery with ID: %d", id);
        return true;
    } catch (error) {
        debug("Error deleting UserQuery: %O", error);
        throw error;
    }
};

module.exports = {
    createUserQuery,
    getUserQueries,
    getUserQueryById,
    updateUserQuery,
    deleteUserQuery,
};
