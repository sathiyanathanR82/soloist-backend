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
    sanitizeUser(user, requesterId) {
        if (!user)
            return null;
        const userData = user.toObject ? user.toObject() : { ...user };
        const requesterUid = requesterId;
        const targetUid = userData.uid || userData._id?.toString();
        const isMe = requesterUid && targetUid && requesterUid === targetUid;
        const isNetwork = requesterUid && userData.network?.myNetwork?.includes(requesterUid);
        // Profile Visibility Enforcement
        if (!isMe) {
            if (userData.profileVisibility === 'Only me') {
                // If profile visibility is 'Only me', hide almost everything except name and photo
                // Actually, maybe we should return null or a very minimal object?
                return {
                    uid: userData.uid,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    profilePic: userData.profilePic,
                    profileVisibility: userData.profileVisibility,
                    registerUser: userData.registerUser
                };
            }
            if (userData.profileVisibility === 'Only my network' && !isNetwork) {
                // Restricted profile for non-network users
                return {
                    uid: userData.uid,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    profilePic: userData.profilePic,
                    headline: userData.headline,
                    profileVisibility: userData.profileVisibility,
                    registerUser: userData.registerUser
                };
            }
        }
        // Field-level visibility (Email)
        if (!isMe && userData.emailVisibility) {
            if (userData.emailVisibility === 'Only me' ||
                (userData.emailVisibility === 'Only my network' && !isNetwork)) {
                delete userData.email;
            }
        }
        // Field-level visibility (Phone)
        if (!isMe && userData.phoneVisibility) {
            if (userData.phoneVisibility === 'Only me' ||
                (userData.phoneVisibility === 'Only my network' && !isNetwork)) {
                delete userData.phone;
            }
        }
        // Always remove sensitive internal fields
        delete userData.providers;
        delete userData.__v;
        return userData;
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
            user.lastLogin = new Date();
            user.isOnline = true;
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
    async updateUserStatus(userId, isOnline) {
        try {
            await User_1.User.findOneAndUpdate(this.buildUserQuery(userId), { $set: { isOnline, lastLogin: new Date() } });
        }
        catch (error) {
            throw new Error(`Failed to update user status: ${error}`);
        }
    }
    async deleteUser(userId) {
        try {
            await User_1.User.findOneAndUpdate(this.buildUserQuery(userId), { $set: { deletion: true } });
        }
        catch (error) {
            throw new Error(`Failed to delete user: ${error}`);
        }
    }
    async listAllUsers(limit = 10, skip = 0) {
        try {
            return await User_1.User.find({ showInNearbySearch: { $ne: false }, deletion: { $ne: true } })
                .limit(limit)
                .skip(skip)
                .exec();
        }
        catch (error) {
            throw new Error(`Failed to list users: ${error}`);
        }
    }
    async sendNetworkRequest(fromUserId, toUserId) {
        try {
            const recipient = await User_1.User.findOne({ uid: toUserId });
            if (!recipient)
                throw new Error('Recipient not found');
            if (!recipient.network.request.includes(fromUserId) &&
                !recipient.network.myNetwork.includes(fromUserId)) {
                recipient.network.request.push(fromUserId);
                await recipient.save();
            }
        }
        catch (error) {
            throw new Error(`Failed to send network request: ${error}`);
        }
    }
    async approveNetworkRequest(userId, requesterId) {
        try {
            const user = await User_1.User.findOne({ uid: userId });
            const requester = await User_1.User.findOne({ uid: requesterId });
            if (!user || !requester)
                throw new Error('User or requester not found');
            // Remove from request list
            user.network.request = user.network.request.filter(id => id !== requesterId);
            // Add to myNetwork for both
            if (!user.network.myNetwork.includes(requesterId)) {
                user.network.myNetwork.push(requesterId);
            }
            if (!requester.network.myNetwork.includes(userId)) {
                requester.network.myNetwork.push(userId);
            }
            await user.save();
            await requester.save();
        }
        catch (error) {
            throw new Error(`Failed to approve network request: ${error}`);
        }
    }
    async rejectNetworkRequest(userId, requesterId) {
        try {
            const user = await User_1.User.findOne({ uid: userId });
            if (!user)
                throw new Error('User not found');
            user.network.request = user.network.request.filter(id => id !== requesterId);
            await user.save();
        }
        catch (error) {
            throw new Error(`Failed to reject network request: ${error}`);
        }
    }
    async getNetworkInfo(userId) {
        try {
            const user = await User_1.User.findOne({ uid: userId });
            if (!user)
                throw new Error('User not found');
            // Heartbeat: update last active status
            user.lastLogin = new Date();
            user.isOnline = true;
            await user.save();
            const myNetworkRaw = await User_1.User.find({ uid: { $in: user.network.myNetwork } })
                .select('uid firstName lastName email phone profilePic headline profileVisibility emailVisibility phoneVisibility showInNearbySearch');
            const requestsRaw = await User_1.User.find({ uid: { $in: user.network.request } })
                .select('uid firstName lastName email phone profilePic headline profileVisibility emailVisibility phoneVisibility showInNearbySearch');
            const removalRequestsRaw = await User_1.User.find({ uid: { $in: user.network.removalRequest } })
                .select('uid firstName lastName email phone profilePic headline profileVisibility emailVisibility phoneVisibility showInNearbySearch');
            return {
                myNetwork: myNetworkRaw.map(u => this.sanitizeUser(u, userId)),
                requests: requestsRaw.map(u => this.sanitizeUser(u, userId)),
                removalRequests: removalRequestsRaw.map(u => this.sanitizeUser(u, userId)),
                block: user.network.block
            };
        }
        catch (error) {
            throw new Error(`Failed to get network info: ${error}`);
        }
    }
    async removeNetworkConnection(userId, targetId) {
        // This is now a request-based action
        return this.requestNetworkRemoval(userId, targetId);
    }
    async requestNetworkRemoval(userId, targetId) {
        try {
            const target = await User_1.User.findOne({ uid: targetId });
            if (!target)
                throw new Error('Target user not found');
            // Add requester to target's removalRequest list if not already there
            if (!target.network.removalRequest.includes(userId)) {
                target.network.removalRequest.push(userId);
                await target.save();
            }
        }
        catch (error) {
            throw new Error(`Failed to request network removal: ${error}`);
        }
    }
    async approveNetworkRemoval(userId, requesterId) {
        try {
            const user = await User_1.User.findOne({ uid: userId });
            const requester = await User_1.User.findOne({ uid: requesterId });
            if (!user || !requester)
                throw new Error('User or requester not found');
            // Remove from removalRequest list
            user.network.removalRequest = user.network.removalRequest.filter(id => id !== requesterId);
            // Remove from myNetwork for both (Final disconnection)
            user.network.myNetwork = user.network.myNetwork.filter(id => id !== requesterId);
            requester.network.myNetwork = requester.network.myNetwork.filter(id => id !== userId);
            await user.save();
            await requester.save();
        }
        catch (error) {
            throw new Error(`Failed to approve network removal: ${error}`);
        }
    }
    async rejectNetworkRemoval(userId, requesterId) {
        try {
            const user = await User_1.User.findOne({ uid: userId });
            if (!user)
                throw new Error('User not found');
            // Just clear the request
            user.network.removalRequest = user.network.removalRequest.filter(id => id !== requesterId);
            await user.save();
        }
        catch (error) {
            throw new Error(`Failed to reject network removal: ${error}`);
        }
    }
    async cancelNetworkRequest(userId, targetId) {
        try {
            const target = await User_1.User.findOne({ uid: targetId });
            if (!target)
                throw new Error('Target user not found');
            // Remove the current user from the target user's incoming request list
            target.network.request = target.network.request.filter(id => id !== userId);
            await target.save();
        }
        catch (error) {
            throw new Error(`Failed to cancel network request: ${error}`);
        }
    }
    async blockUser(userId, targetId) {
        try {
            const user = await User_1.User.findOne({ uid: userId });
            const target = await User_1.User.findOne({ uid: targetId });
            if (!user)
                throw new Error('User not found');
            // 1. Add to block list if not already there
            if (!user.network.block.includes(targetId)) {
                user.network.block.push(targetId);
            }
            // 2. Remove from myNetwork
            user.network.myNetwork = user.network.myNetwork.filter(id => id !== targetId);
            // 3. Remove from request list (both directions)
            user.network.request = user.network.request.filter(id => id !== targetId);
            if (target) {
                target.network.request = target.network.request.filter(id => id !== userId);
                target.network.myNetwork = target.network.myNetwork.filter(id => id !== userId);
                await target.save();
            }
            await user.save();
        }
        catch (error) {
            throw new Error(`Failed to block user: ${error}`);
        }
    }
    async unblockUser(userId, targetId) {
        try {
            const user = await User_1.User.findOne({ uid: userId });
            if (!user)
                throw new Error('User not found');
            user.network.block = user.network.block.filter(id => id !== targetId);
            await user.save();
        }
        catch (error) {
            throw new Error(`Failed to unblock user: ${error}`);
        }
    }
}
exports.AuthService = AuthService;
