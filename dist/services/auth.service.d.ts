import { IUser } from '../models/User';
export declare class AuthService {
    private buildUserQuery;
    sanitizeUser(user: any, requesterId?: string): any;
    private generateBase64Image;
    findOrCreateUser(profile: any, provider: string): Promise<{
        user: IUser;
        token: string;
        isNewUser: boolean;
    }>;
    getUserById(userId: string): Promise<IUser | null>;
    updateUserProfile(userId: string, profileData: any): Promise<IUser | null>;
    updateUserStatus(userId: string, isOnline: boolean): Promise<void>;
    deleteUser(userId: string): Promise<void>;
    listAllUsers(limit?: number, skip?: number): Promise<IUser[]>;
    sendNetworkRequest(fromUserId: string, toUserId: string, inviteMessage?: string): Promise<void>;
    approveNetworkRequest(userId: string, requesterId: string): Promise<void>;
    rejectNetworkRequest(userId: string, requesterId: string): Promise<void>;
    getInviteMessages(user: any, targetUid: string): Promise<any[]>;
    getNetworkInfo(userId: string): Promise<any>;
    removeNetworkConnection(userId: string, targetId: string): Promise<void>;
    requestNetworkRemoval(userId: string, targetId: string): Promise<void>;
    approveNetworkRemoval(userId: string, requesterId: string): Promise<void>;
    rejectNetworkRemoval(userId: string, requesterId: string): Promise<void>;
    cancelNetworkRequest(userId: string, targetId: string): Promise<void>;
    blockUser(userId: string, targetId: string): Promise<void>;
    unblockUser(userId: string, targetId: string): Promise<void>;
    sendMessage(senderId: string, targetId: string, text: string): Promise<void>;
    getMessagesWith(userId: string, targetId: string, limit?: number): Promise<any[]>;
    getMessagesByConversationId(userId: string, conversationId: string, limit?: number): Promise<any[]>;
}
