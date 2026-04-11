import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    gender?: string;
    phone?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    headline?: string;
    bio?: string;
    website?: string;
    profilePic?: string;
    registerUser?: boolean;
    providers: {
        name: string;
        id: string;
        email?: string;
        accessToken?: string;
        refreshToken?: string;
    }[];
    network: {
        myNetwork: string[];
        request: {
            userId: string;
            inviteMessage?: string;
        }[];
        block: string[];
        removalRequest: string[];
        messages: {
            withUserId: string;
            messages: {
                from: string;
                to: string;
                text: string;
                timestamp: Date;
                type?: 'invite' | 'message';
            }[];
        }[];
    };
    lastLogin?: Date;
    isOnline?: boolean;
    profileVisibility?: 'All users' | 'Only my network' | 'Only me';
    emailVisibility?: 'All users' | 'Only my network' | 'Only me';
    phoneVisibility?: 'All users' | 'Only my network' | 'Only me';
    showInNearbySearch?: boolean;
    deletion?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
