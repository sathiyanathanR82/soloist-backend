"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
class AuthService {
    async findOrCreateUser(profile, provider) {
        try {
            const email = profile.emails?.[0]?.value || profile.email;
            let user = await User_1.User.findOne({ email });
            if (!user) {
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
                // Check if provider already exists
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
            const token = (0, jwt_1.generateToken)(user._id.toString());
            return { user, token };
        }
        catch (error) {
            throw new Error(`Failed to find or create user: ${error}`);
        }
    }
    async getUserById(userId) {
        try {
            return await User_1.User.findById(userId);
        }
        catch (error) {
            throw new Error(`Failed to get user: ${error}`);
        }
    }
    async updateUserProfile(userId, profileData) {
        try {
            const user = await User_1.User.findByIdAndUpdate(userId, { $set: profileData }, { new: true, runValidators: true });
            return user;
        }
        catch (error) {
            throw new Error(`Failed to update user profile: ${error}`);
        }
    }
    async deleteUser(userId) {
        try {
            await User_1.User.findByIdAndDelete(userId);
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
