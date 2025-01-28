import { get } from "http";

const { db } = require("../../db/models"); 
const debug = require("debug")("app:channel-crud");
const axios = require('axios');
const Channel = db.Channel;

interface ChannelData {
    slackInstallationId: number;
    channelName: string;
}

/**
 * Create a new Channel
 * @param {ChannelData} channelData - Data for creating a channel
 * @returns {Promise<object>} The created Channel instance
 */


const createChannel = async (channelData: ChannelData) => {
    try {
        const [channel, created] = await Channel.findOrCreate({
            where: {
                slackInstallationId: channelData.slackInstallationId,
                channelName: channelData.channelName,
            },
            defaults: channelData,
        });

        debug(created ? 'Channel created' : 'Channel already exists', channel);
        return channel;
    } catch (error) {
        debug('Error creating channel:', error);
        throw new Error('Failed to create channel');
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
    } catch (error) {
        debug("Error fetching channels: %O", error);
        throw new Error("Failed to retrieve channels");
    }
};

/**
 * Retrieve a Channel by ID
 * @param {number} id - Channel ID
 * @returns {Promise<object|null>} The Channel instance or null if not found
 */

const getChannelById = async (id: number) => {
    debug("Fetching channel by ID: %d", id);
    try {
        const channel = await Channel.findByPk(id);
        if (!channel) {
            debug("Channel not found for ID: %d", id);
        }
        return channel;
    } catch (error) {
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

const updateChannel = async (id: number, updateData: Partial<ChannelData>) => {
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
    } catch (error) {
        debug("Error updating channel: %O", error);
        throw new Error("Failed to update channel");
    }
};

/**
 * Delete a Channel
 * @param {number} id - ID of the channel to delete
 * @returns {Promise<boolean>} True if deletion was successful, false otherwise
 */

const deleteChannel = async (id: number) => {
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
    } catch (error) {
        debug("Error deleting channel: %O", error);
        throw new Error("Failed to delete channel");
    }
};

// Function to get channel info
async function getChannelInfo(channelId:any, botAccessToken:any) {
    try {
        const response = await axios.get('https://slack.com/api/conversations.info', {
            headers: {
                Authorization: `Bearer ${botAccessToken}`,
                'Content-Type': 'application/json',
            },
            params: {
                channel: channelId, // Pass the channel ID
            },
        });

        if (response.data.ok) {
            console.log('Channel Information:', response.data.channel);
            return response.data.channel; // Contains channel details, including the name
        } else {
            console.error('Error fetching channel info:', response.data.error);
        }
    } catch (error:any) {
        console.error('Failed to fetch channel info:', error.message);
    }
}



module.exports = {
    createChannel,
    getAllChannels,
    getChannelById,
    updateChannel,
    deleteChannel,
    getChannelInfo
};
