"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
class AuthService {
    buildUserQuery(userId) {
        const query = { uid: userId };
        if (mongoose_1.default.isValidObjectId(userId)) {
            query.$or = [{ _id: userId }, { uid: userId }];
        }
        return query;
    }
    async findOrCreateUser(profile, provider) {
        try {
            const email = profile.emails?.[0]?.value || profile.email;
            let user = await User_1.User.findOne({ email });
            let isNewUser = false;
            if (!user) {
                isNewUser = true;
                user = new User_1.User({
                    email,
                    firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
                    lastName: profile.name?.familyName || profile.displayName?.split(' ')[1] || '',
                    avatar: profile.photos?.[0]?.value || '',
                    providers: [
                        {
                            name: provider,
                            id: profile.id,
                            email,
                            accessToken: profile.accessToken,
                            refreshToken: profile.refreshToken
                        }
                    ]
                });
            }
            else {
                if (!user.uid) {
                    user.uid = crypto_1.default.randomUUID();
                }
                const providerExists = user.providers.some(p => p.name === provider);
                if (!providerExists) {
                    user.providers.push({
                        name: provider,
                        id: profile.id,
                        email,
                        accessToken: profile.accessToken,
                        refreshToken: profile.refreshToken
                    });
                }
            }
            await user.save();
            const token = (0, jwt_1.generateToken)(user.uid);
            return { user, token, isNewUser };
        }
        catch (error) {
            throw new Error(`Failed to find or create user: ${error}`);
        }
    }
    async getUserById(userId) {
        try {
            console.log('getUserById: Searching for user with userId:', userId);
            const query = this.buildUserQuery(userId);
            console.log('getUserById: Query:', JSON.stringify(query));
            const user = await User_1.User.findOne(query);
            console.log('getUserById: Found user:', user ? 'YES' : 'NO');
            return user;
        }
        catch (error) {
            console.error('getUserById error:', error);
            throw new Error(`Failed to get user: ${error?.message}`);
        }
    }
    async updateUserProfile(userId, profileData) {
        try {
            const user = await User_1.User.findOneAndUpdate(this.buildUserQuery(userId), { $set: profileData }, { new: true, runValidators: true });
            return user;
        }
        catch (error) {
            throw new Error(`Failed to update user profile: ${error}`);
        }
    }
    async deleteUser(userId) {
        try {
            await User_1.User.findOneAndDelete(this.buildUserQuery(userId));
        }
        catch (error) {
            throw new Error(`Failed to delete user: ${error}`);
        }
    }
    async listAllUsers(limit = 10, skip = 0) {
        try {
            return await User_1.User.find()
                .limit(limit)
                .skip(skip)
                .exec();
        }
        catch (error) {
            throw new Error(`Failed to list users: ${error}`);
        }
    }
}
exports.AuthService = AuthService;
