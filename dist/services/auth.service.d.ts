import { IUser } from '../models/User';
export declare class AuthService {
    private buildUserQuery;
    private generateBase64Image;
    findOrCreateUser(profile: any, provider: string): Promise<{
        user: IUser;
        token: string;
        isNewUser: boolean;
    }>;
    getUserById(userId: string): Promise<IUser | null>;
    updateUserProfile(userId: string, profileData: any): Promise<IUser | null>;
    deleteUser(userId: string): Promise<void>;
    listAllUsers(limit?: number, skip?: number): Promise<IUser[]>;
    sendNetworkRequest(fromUserId: string, toUserId: string): Promise<void>;
    approveNetworkRequest(userId: string, requesterId: string): Promise<void>;
    rejectNetworkRequest(userId: string, requesterId: string): Promise<void>;
    getNetworkInfo(userId: string): Promise<{
        myNetwork: IUser[];
        requests: IUser[];
    }>;
}
