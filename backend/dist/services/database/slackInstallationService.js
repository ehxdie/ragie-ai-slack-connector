"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { db } = require("../../db/models");
const debug = require("debug")("slack:crud"); // Debug namespace
const SlackInstallation = db.SlackInstallation;
/**
 * Create a new Slack installation.
 * @param {object} data - Slack installation attributes
 * @returns {Promise<object>} The created SlackInstallation instance
 */
const createSlackInstallation = async (data) => {
    debug("Creating a new Slack installation with data: %O", data);
    try {
        const installation = await SlackInstallation.create(data);
        debug("Created Slack installation: %O", installation);
        return installation;
    }
    catch (error) {
        debug("Error creating Slack installation: %O", error);
        throw error;
    }
};
/**
 * Fetch all Slack installations or find by criteria.
 * @param {object} [criteria={}] - Search filters
 * @returns {Promise<object[]>} Array of SlackInstallation instances
 */
const getSlackInstallations = async (criteria = {}) => {
    debug("Fetching Slack installations with criteria: %O", criteria);
    try {
        const installations = await SlackInstallation.findAll({ where: criteria });
        debug("Fetched Slack installations: %O", installations);
        return installations;
    }
    catch (error) {
        debug("Error fetching Slack installations: %O", error);
        throw error;
    }
};
/**
 * Fetch a specific Slack installation by ID.
 * @param {number} id - Slack installation ID
 * @returns {Promise<object|null>} The SlackInstallation instance, or null if not found
 */
const getSlackInstallationById = async (id) => {
    debug("Fetching Slack installation by ID: %d", id);
    try {
        const installation = await SlackInstallation.findByPk(id);
        if (!installation) {
            debug("No Slack installation found for ID: %d", id);
        }
        else {
            debug("Fetched Slack installation: %O", installation);
        }
        return installation;
    }
    catch (error) {
        debug("Error fetching Slack installation by ID: %O", error);
        throw error;
    }
};
/**
 * Update a Slack installation record.
 * @param {number} id - ID of the Slack installation to update
 * @param {object} data - Data to update
 * @returns {Promise<object|null>} The updated SlackInstallation instance, or null if not found
 */
const updateSlackInstallation = async (id, data) => {
    debug("Updating Slack installation with ID: %d and data: %O", id, data);
    try {
        const installation = await SlackInstallation.findByPk(id);
        if (!installation) {
            debug("No Slack installation found for ID: %d", id);
            return null;
        }
        await installation.update(data);
        debug("Updated Slack installation: %O", installation);
        return installation;
    }
    catch (error) {
        debug("Error updating Slack installation: %O", error);
        throw error;
    }
};
/**
 * Delete a Slack installation record.
 * @param {number} id - ID of the Slack installation to delete
 * @returns {Promise<boolean>} True if deleted successfully, false otherwise
 */
const deleteSlackInstallation = async (id) => {
    debug("Deleting Slack installation with ID: %d", id);
    try {
        const installation = await SlackInstallation.findByPk(id);
        if (!installation) {
            debug("No Slack installation found for ID: %d", id);
            return false;
        }
        await installation.destroy();
        debug("Deleted Slack installation with ID: %d", id);
        return true;
    }
    catch (error) {
        debug("Error deleting Slack installation: %O", error);
        throw error;
    }
};
module.exports = {
    createSlackInstallation,
    getSlackInstallations,
    getSlackInstallationById,
    updateSlackInstallation,
    deleteSlackInstallation,
};
