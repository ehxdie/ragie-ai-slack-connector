// In-memory storage for Slack installation data
const installations = {};
/**
 * Save Slack installation data in memory.
 */
export const saveSlackInstallation = (installationData) => {
    try {
        const teamId = installationData.teamId;
        // Add or update the installation data in memory
        installations[teamId] = { ...installationData, timestamp: Date.now() };
        console.log(installations);
        // console.log(`Saved Slack installation for team: ${installationData.teamName}`);
    }
    catch (error) {
        console.error("Error saving installation data:", error);
        throw new Error(`Failed to save installation: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
};
export const returnCurrentToken = () => {
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
    }
    catch (error) {
        console.error("Error retrieving the latest botAccessToken:", error);
        throw new Error(`Failed to retrieve botAccessToken: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
};
