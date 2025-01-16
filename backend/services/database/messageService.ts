const { db } = require("../../db/models");
const debug = require("debug")("message:crud"); // Debug namespace
const Message = db.Message;

interface MessageData {
    workspaceInstallationId: number;
    channelId: number;
    originalSenderId: string;
    messageText: string;
    timestamp: number;
    kafkaOffset: number;
    processedForRag: boolean;
    createdAt?: Date;
}

/**
 * Create a new Message.
 * @param {MessageData} data - Message attributes
 * @returns {Promise<object>} The created Message instance
 */

const createMessage = async (data: MessageData) => {
    debug("Creating a new Message with data: %O", data);
    try {
        const message = await Message.create(data);
        debug("Created Message: %O", message);
        return message;
    } catch (error) {
        debug("Error creating Message: %O", error);
        throw error;
    }
};

/**
 * Fetch all Messages or find by criteria.
 * @param {object} [criteria={}] - Search filters
 * @returns {Promise<object[]>} Array of Message instances
 */

const getMessages = async (criteria = {}) => {
    debug("Fetching Messages with criteria: %O", criteria);
    try {
        const messages = await Message.findAll({ where: criteria });
        debug("Fetched Messages: %O", messages);
        return messages;
    } catch (error) {
        debug("Error fetching Messages: %O", error);
        throw error;
    }
};

/**
 * Fetch a specific Message by ID.
 * @param {number} id - Message ID
 * @returns {Promise<object|null>} The Message instance, or null if not found
 */

const getMessageById = async (id: number) => {
    debug("Fetching Message by ID: %d", id);
    try {
        const message = await Message.findByPk(id);
        if (!message) {
            debug("No Message found for ID: %d", id);
        } else {
            debug("Fetched Message: %O", message);
        }
        return message;
    } catch (error) {
        debug("Error fetching Message by ID: %O", error);
        throw error;
    }
};

/**
 * Update a Message record.
 * @param {number} id - ID of the Message to update
 * @param {Partial<MessageData>} data - Data to update
 * @returns {Promise<object|null>} The updated Message instance, or null if not found
 */

const updateMessage = async (id: number, data: Partial<MessageData>) => {
    debug("Updating Message with ID: %d and data: %O", id, data);
    try {
        const message = await Message.findByPk(id);
        if (!message) {
            debug("No Message found for ID: %d", id);
            return null;
        }
        await message.update(data);
        debug("Updated Message: %O", message);
        return message;
    } catch (error) {
        debug("Error updating Message: %O", error);
        throw error;
    }
};

/**
 * Delete a Message record.
 * @param {number} id - ID of the Message to delete
 * @returns {Promise<boolean>} True if deleted successfully, false otherwise
 */

const deleteMessage = async (id: number) => {
    debug("Deleting Message with ID: %d", id);
    try {
        const message = await Message.findByPk(id);
        if (!message) {
            debug("No Message found for ID: %d", id);
            return false;
        }
        await message.destroy();
        debug("Deleted Message with ID: %d", id);
        return true;
    } catch (error) {
        debug("Error deleting Message: %O", error);
        throw error;
    }
};

module.exports = {
    createMessage,
    getMessages,
    getMessageById,
    updateMessage,
    deleteMessage,
};
