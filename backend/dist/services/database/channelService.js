"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { db } = require("../../db/models");
const debug = require("debug")("app:channel-crud");
const Channel = db.Channel;
/**
 * Create a new Channel
 * @param {ChannelData} channelData - Data for creating a channel
 * @returns {Promise<object>} The created Channel instance
 */
const createChannel = async (channelData) => {
    debug("Creating a channel with data: %O", channelData);
    try {
        const channel = await Channel.create(channelData);
        debug("Created channel: %O", channel);
        return channel;
    }
    catch (error) {
        debug("Error creating channel: %O", error);
        throw new Error("Failed to create channel");
    }
};
/**
 * Retrieve all Channels
 * @param {object} filter - Filter options for retrieving channels
 * @returns {Promise<object[]>} Array of Channel instances
 */
const getAllChannels = async (filter = {}) => {
    debug("Fetching all channels with filter: %O", filter);
    try {
        const channels = await Channel.findAll({ where: filter });
        debug("Fetched channels: %O", channels);
        return channels;
    }
    catch (error) {
        debug("Error fetching channels: %O", error);
        throw new Error("Failed to retrieve channels");
    }
};
/**
 * Retrieve a Channel by ID
 * @param {number} id - Channel ID
 * @returns {Promise<object|null>} The Channel instance or null if not found
 */
const getChannelById = async (id) => {
    debug("Fetching channel by ID: %d", id);
    try {
        const channel = await Channel.findByPk(id);
        if (!channel) {
            debug("Channel not found for ID: %d", id);
        }
        return channel;
    }
    catch (error) {
        debug("Error fetching channel by ID: %O", error);
        throw new Error("Failed to retrieve channel");
    }
};
/**
 * Update a Channel
 * @param {number} id - ID of the channel to update
 * @param {Partial<ChannelData>} updateData - Data to update
 * @returns {Promise<object|null>} The updated Channel instance or null if not found
 */
const updateChannel = async (id, updateData) => {
    debug("Updating channel with ID: %d, data: %O", id, updateData);
    try {
        const channel = await Channel.findByPk(id);
        if (!channel) {
            debug("Channel not found for ID: %d", id);
            return null;
        }
        await channel.update(updateData);
        debug("Updated channel: %O", channel);
        return channel;
    }
    catch (error) {
        debug("Error updating channel: %O", error);
        throw new Error("Failed to update channel");
    }
};
/**
 * Delete a Channel
 * @param {number} id - ID of the channel to delete
 * @returns {Promise<boolean>} True if deletion was successful, false otherwise
 */
const deleteChannel = async (id) => {
    debug("Deleting channel with ID: %d", id);
    try {
        const channel = await Channel.findByPk(id);
        if (!channel) {
            debug("Channel not found for ID: %d", id);
            return false;
        }
        await channel.destroy();
        debug("Deleted channel with ID: %d", id);
        return true;
    }
    catch (error) {
        debug("Error deleting channel: %O", error);
        throw new Error("Failed to delete channel");
    }
};
module.exports = {
    createChannel,
    getAllChannels,
    getChannelById,
    updateChannel,
    deleteChannel,
};
