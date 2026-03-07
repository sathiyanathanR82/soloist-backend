import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

const authService = new AuthService();

export class UserController {
  
  async getUserProfile(req: AuthRequest, res: Response) {
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
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile',
        data: null
      });
    }
  }

  async updateUserProfile(req: AuthRequest, res: Response) {
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
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update user profile',
        data: null
      });
    }
  }

  async deleteUserAccount(req: AuthRequest, res: Response) {
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
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete user account',
        data: null
      });
    }
  }

  async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = parseInt(req.query.skip as string) || 0;

      const users = await authService.listAllUsers(limit, skip);

      res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get users',
        data: null
      });
    }
  }
}
