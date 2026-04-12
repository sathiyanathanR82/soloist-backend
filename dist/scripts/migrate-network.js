"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const User_1 = require("../models/User");
// Load environment variables from the root .env file
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/soloist';
async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected successfully.');
        console.log('Finding users missing network field...');
        const result = await User_1.User.updateMany({ network: { $exists: false } }, {
            $set: {
                network: {
                    myNetwork: [],
                    request: [],
                    block: [],
                    removalRequest: [],
                    messages: []
                }
            }
        });
        console.log(`Migration complete!`);
        console.log(`Matched: ${result.matchedCount}`);
        console.log(`Modified: ${result.modifiedCount}`);
        // Clean up invalid network request entries (missing userId)
        console.log('Cleaning up invalid network request entries...');
        const usersWithNetworkRequests = await User_1.User.find({
            'network.request': { $exists: true }
        });
        let cleanedCount = 0;
        for (const user of usersWithNetworkRequests) {
            const originalLength = user.network.request?.length || 0;
            user.network.request = (user.network.request || []).filter((req) => req && req.userId);
            const newLength = user.network.request?.length || 0;
            if (originalLength !== newLength) {
                await user.save();
                cleanedCount++;
                console.log(`Cleaned user ${user._id}: removed ${originalLength - newLength} invalid entries`);
            }
        }
        console.log(`Cleanup complete! Fixed ${cleanedCount} users.`);
    }
    catch (error) {
        console.error('Migration failed:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
}
migrate();
