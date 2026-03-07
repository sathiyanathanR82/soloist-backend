import mongoose from 'mongoose';
export declare const connectDB: () => Promise<mongoose.Connection>;
export declare const disconnectDB: () => Promise<void>;
