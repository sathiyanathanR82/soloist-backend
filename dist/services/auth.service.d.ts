import { IUser } from '../models/User';
export declare class AuthService {
    findOrCreateUser(profile: any, provider: string): Promise<{
        user: IUser;
        token: string;
    }>;
    getUserById(userId: string): Promise<IUser | null>;
    updateUserProfile(userId: string, profileData: Partial<IUser>): Promise<IUser | null>;
    deleteUser(userId: string): Promise<void>;
    listAllUsers(limit?: number, skip?: number): Promise<IUser[]>;
}
