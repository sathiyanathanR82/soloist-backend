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
    headline?: string;
    bio?: string;
    website?: string;
    avatar?: string;
    providers: {
        name: string;
        id: string;
        email?: string;
        accessToken?: string;
        refreshToken?: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
