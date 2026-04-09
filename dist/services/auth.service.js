"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const axios_1 = __importDefault(require("axios"));
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
    async generateBase64Image(imageUrl) {
        if (!imageUrl)
            return null;
        // If the image is already a Base64 string, return it immediately
        if (imageUrl.startsWith('data:'))
            return imageUrl;
        try {
            const response = await axios_1.default.get(imageUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');
            const contentType = response.headers['content-type'];
            return `data:${contentType};base64,${buffer.toString('base64')}`;
        }
        catch (error) {
            console.error('Failed to generate base64 image:', error);
            return null;
        }
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
                    registerUser: false,
                    firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
                    lastName: profile.name?.familyName || profile.displayName?.split(' ')[1] || '',
                    profilePic: await this.generateBase64Image(profile.photos?.[0]?.value),
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
                // Update profilePic if needed
                const newAvatar = profile.photos?.[0]?.value || '';
                if (newAvatar && !user.profilePic) {
                    user.profilePic = await this.generateBase64Image(newAvatar) || undefined;
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
            // Handle legacy 'avatar' or standardized 'profilePic' fields
            const imageToProcess = profileData.avatar || profileData.profilePic;
            if (imageToProcess) {
                profileData.profilePic = await this.generateBase64Image(imageToProcess) || undefined;
                delete profileData.avatar;
            }
            if (profileData.registerUser !== undefined) {
                profileData.registerUser = Boolean(profileData.registerUser);
            }
            const user = await User_1.User.findOneAndUpdate(this.buildUserQuery(userId), {
                $set: profileData,
                $unset: { avatar: "" } // Ensure legacy avatar field is removed from DB
            }, { new: true, runValidators: true });
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
