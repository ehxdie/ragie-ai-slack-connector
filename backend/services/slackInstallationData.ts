import db from "../db/models/index.js";

interface SlackInstallationData {
    teamId: string;
    teamName: string;
    botUserId: string;
    botAccessToken: string;
    userAccessToken: string;
    userId: string;
    appId: string;
    scopes: {
        botScopes: string[];
        userScopes: string[];
    };
    enterpriseId?: string | null;
    isEnterpriseInstall: boolean;
    timestamp: number;
}

// In-memory storage for Slack installation data
const installations: Record<string, SlackInstallationData> = {};

/**
 * Save Slack installation data in memory.
 */
export const saveSlackInstallation = async (installationData: SlackInstallationData) => {
    
    try {
        const teamId = installationData.teamId;

        // Add or update the installation data in memory
        installations[teamId] = { ...installationData, timestamp: Date.now() };

        console.log(installations);
        
        
        await saveSlackInstallationInDb(installationData)
       

        console.log(`Saved Slack installation for team in DB: ${installationData.teamName}`);

    } catch (error) {

        console.error("Error saving installation data:", error);
        throw new Error(`Failed to save installation: ${error instanceof Error ? error.message : "Unknown error"}`);

    }
};

export const saveSlackInstallationInDb = async (installationData: SlackInstallationData): Promise<void> => {
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
            scopes: installationData.scopes,
            enterpriseId: installationData.enterpriseId,
            isEnterpriseInstall: installationData.isEnterpriseInstall,
            timestamp: installationData.timestamp,
        });

        console.log({
            ...logContext,
            message: 'Successfully saved installation in database',
            duration: Date.now() - startTime
        });

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

        console.error('Database save failed:', errorDetails);
        throw new Error(`Database save failed: ${errorMessage}`);
    }
};

export const returnCurrentToken = (): string | null => {
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

        console.error("Error retrieving the latest botAccessToken:", error);
        throw new Error(`Failed to retrieve botAccessToken: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
};
