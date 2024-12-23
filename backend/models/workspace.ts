export interface Workspace {
    id: string;
    teamName: string;
    accessToken: string;
    botUserId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface WorkspaceMessage {
    workspaceId: string;
    channelId: string;
    channelName: string;
    userId: string;
    text: string;
    timestamp: string;
}
