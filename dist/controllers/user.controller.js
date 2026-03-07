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
            const { firstName, lastName, dateOfBirth, gender, phone, location, headline, bio, website } = req.body;
            if (req.user?.userId !== id) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: Cannot update another user profile',
                    data: null
                });
            }
            const profileData = {
                firstName,
                lastName,
                dateOfBirth,
                gender,
                phone,
                location,
                headline,
                bio,
                website
            };
            const updatedUser = await authService.updateUserProfile(id, profileData);
            if (!updatedUser) {
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
            res.status(500).json({
                success: false,
                message: 'Failed to update user profile',
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
}
exports.UserController = UserController;
