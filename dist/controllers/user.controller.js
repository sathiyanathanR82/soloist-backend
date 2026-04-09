"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const auth_service_1 = require("../services/auth.service");
const authService = new auth_service_1.AuthService();
class UserController {
    async getUserProfile(req, res) {
        try {
            const { id } = req.params;
            const user = await authService.getUserById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    data: null
                });
            }
            res.json({
                success: true,
                message: 'User profile retrieved successfully',
                data: user
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get user profile',
                data: null
            });
        }
    }
    async updateUserProfile(req, res) {
        try {
            const { id } = req.params;
            const currentUserId = req.user?.userId || req.user?.id;
            console.log('updateUserProfile:', {
                urlId: id,
                tokenUserId: currentUserId,
                tokenUser: req.user,
                match: currentUserId === id
            });
            console.log('updateUserProfile Request Body:', req.body);
            const allowedFields = [
                'firstName',
                'lastName',
                'dateOfBirth',
                'gender',
                'phone',
                'location',
                'latitude',
                'longitude',
                'headline',
                'bio',
                'website',
                'registerUser',
                'profilePic',
                'avatar'
            ];
            if (currentUserId !== id) {
                console.error('updateUserProfile: User mismatch', { currentUserId, id });
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: Cannot update another user profile',
                    data: null
                });
            }
            const profileData = {};
            allowedFields.forEach((field) => {
                if (req.body[field] !== undefined) {
                    profileData[field] = req.body[field];
                }
            });
            if (Object.keys(profileData).length === 0) {
                console.warn('updateUserProfile: No valid fields found in request body.', {
                    receivedFields: Object.keys(req.body),
                    allowedFields,
                    userId: id,
                    currentUserId
                });
                return res.status(400).json({
                    success: false,
                    message: 'No valid profile fields provided for update. Check the allowed fields list.',
                    data: null
                });
            }
            const updatedUser = await authService.updateUserProfile(id, profileData);
            if (!updatedUser) {
                console.error('updateUserProfile: User not found', { id });
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    data: null
                });
            }
            res.json({
                success: true,
                message: 'User profile updated successfully',
                data: updatedUser
            });
        }
        catch (error) {
            console.error('updateUserProfile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update user profile',
                error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
                data: null
            });
        }
    }
    async deleteUserAccount(req, res) {
        try {
            const { id } = req.params;
            if (req.user?.userId !== id) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: Cannot delete another user account',
                    data: null
                });
            }
            await authService.deleteUser(id);
            res.json({
                success: true,
                message: 'User account deleted successfully',
                data: null
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to delete user account',
                data: null
            });
        }
    }
    async getAllUsers(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const skip = parseInt(req.query.skip) || 0;
            const users = await authService.listAllUsers(limit, skip);
            res.json({
                success: true,
                message: 'Users retrieved successfully',
                data: users
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get users',
                data: null
            });
        }
    }
    async sendRequest(req, res) {
        try {
            const { targetId } = req.params;
            const fromUserId = req.user?.id || req.user?.userId;
            if (!fromUserId)
                throw new Error('Unauthorized');
            await authService.sendNetworkRequest(fromUserId, targetId);
            res.json({
                success: true,
                message: 'Network request sent successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to send network request'
            });
        }
    }
    async approveRequest(req, res) {
        try {
            const { requesterId } = req.params;
            const userId = req.user?.id || req.user?.userId;
            if (!userId)
                throw new Error('Unauthorized');
            await authService.approveNetworkRequest(userId, requesterId);
            res.json({
                success: true,
                message: 'Network request approved'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to approve network request'
            });
        }
    }
    async rejectRequest(req, res) {
        try {
            const { requesterId } = req.params;
            const userId = req.user?.id || req.user?.userId;
            if (!userId)
                throw new Error('Unauthorized');
            await authService.rejectNetworkRequest(userId, requesterId);
            res.json({
                success: true,
                message: 'Network request rejected'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to reject network request'
            });
        }
    }
    async getNetworkInfo(req, res) {
        try {
            const userId = req.user?.id || req.user?.userId;
            if (!userId)
                throw new Error('Unauthorized');
            const info = await authService.getNetworkInfo(userId);
            res.json({
                success: true,
                data: info
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get network info'
            });
        }
    }
}
exports.UserController = UserController;
