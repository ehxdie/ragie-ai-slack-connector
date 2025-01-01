const { db } = require("../db/models/index");
const debug = require('debug')('app:slackInstallationData');

interface SlackInstallationData {
    teamId: string;
    teamName: string;
    botUserId: string;
    botAccessToken: string;
    userAccessToken: string;
    userId: string;
    appId: string;
    enterpriseId?: string | null;
    isEnterpriseInstall: boolean;
    timestamp: number;
}

// In-memory storage for Slack installation data
const installations: Record<string, SlackInstallationData> = {};

/**
 * Save Slack installation data in memory.
 */
const saveSlackInstallation = async (installationData: SlackInstallationData) => {

    try {
        const teamId = installationData.teamId;

        // Add or update the installation data in memory
        installations[teamId] = { ...installationData, timestamp: Date.now() };


        debug(`Saved Slack installation for team in memory: ${installationData.teamName}`);


        await saveSlackInstallationInDb(installationData)


    } catch (error) {

        debug("Failed to save installation for team", error);
        throw new Error(`Failed to save installation: ${error instanceof Error ? error.message : "Unknown error"}`);

    }
};

const saveSlackInstallationInDb = async (installationData: SlackInstallationData): Promise<void> => {
    const startTime = Date.now();
    const logContext = {
        teamId: installationData.teamId,
        teamName: installationData.teamName,
        operation: 'saveSlackInstallationInDb'
    };

    try {
        await db.SlackInstallation.create({
            teamId: installationData.teamId,
            teamName: installationData.teamName,
            botUserId: installationData.botUserId,
            botAccessToken: installationData.botAccessToken,
            userAccessToken: installationData.userAccessToken,
            userId: installationData.userId,
            appId: installationData.appId,
            enterpriseId: installationData.enterpriseId,
            isEnterpriseInstall: installationData.isEnterpriseInstall,
            timestamp: installationData.timestamp,
        });

        debug({
            ...logContext,
            message: 'Successfully saved installation in database',
            duration: Date.now() - startTime
        })

    } catch (error) {
        let errorMessage = 'Unknown database error';
        let errorCode = 'UNKNOWN_ERROR';

        if (error instanceof Error) {
            // Handle Sequelize-specific errors
            if ('name' in error && error.name === 'SequelizeUniqueConstraintError') {
                errorMessage = 'Team installation already exists';
                errorCode = 'DUPLICATE_TEAM';
            } else if ('name' in error && error.name === 'SequelizeValidationError') {
                errorMessage = 'Invalid installation data format';
                errorCode = 'VALIDATION_ERROR';
            }
        }

        const errorDetails = {
            ...logContext,
            errorCode,
            errorMessage,
            originalError: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : 'Unknown error',
            duration: Date.now() - startTime
        };

        debug('Database save failed:',errorDetails);
        throw new Error(`Database save failed: ${errorMessage}`);
    }
};

const returnCurrentToken = (): string | null => {
    try {
        if (Object.keys(installations).length === 0) {
            console.log("No installations found.");
            return null; // Return null if no installation data is available
        }

        // Find the installation with the latest timestamp
        const latestInstallation = Object.values(installations).reduce((latest, current) => {
            return current.timestamp > latest.timestamp ? current : latest;
        });

        // Return the botAccessToken from the latest installation
        return latestInstallation.botAccessToken;

    } catch (error) {

        debug("Error retrieving the latest botAccessToken:", error);
        throw new Error(`Failed to retrieve botAccessToken: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
};

module.exports = {
    saveSlackInstallation,
    saveSlackInstallationInDb,
    returnCurrentToken,
    installations
};