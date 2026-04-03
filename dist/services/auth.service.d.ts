import { IUser } from '../models/User';
export declare class AuthService {
    private buildUserQuery;
    findOrCreateUser(profile: any, provider: string): Promise<{
        user: IUser;
        token: string;
        isNewUser: boolean;
    }>;
    getUserById(userId: string): Promise<IUser | null>;
    updateUserProfile(userId: string, profileData: Partial<IUser>): Promise<IUser | null>;
    deleteUser(userId: string): Promise<void>;
    listAllUsers(limit?: number, skip?: number): Promise<IUser[]>;
}
