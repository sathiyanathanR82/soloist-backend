import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

const authService = new AuthService();

export class UserController {

  async getUserProfile(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const user = await authService.getUserById(id);

      const requesterId = req.user?.userId || req.user?.id;
      const sanitizedUser = authService.sanitizeUser(user, requesterId);

      if (!sanitizedUser) {
        return res.status(403).json({
          success: false,
          message: 'This profile is private',
          data: null
        });
      }

      res.json({
        success: true,
        message: 'User profile retrieved successfully',
        data: sanitizedUser
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
        'avatar',
        'profileVisibility',
        'emailVisibility',
        'phoneVisibility',
        'showInNearbySearch'
      ];

      if (currentUserId !== id) {
        console.error('updateUserProfile: User mismatch', { currentUserId, id });
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Cannot update another user profile',
          data: null
        });
      }

      const profileData: Record<string, any> = {};
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
    } catch (error: any) {
      console.error('updateUserProfile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user profile',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
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

      const requesterId = req.user?.userId || req.user?.id;
      const users = await authService.listAllUsers(limit, skip);
      const sanitizedUsers = users.map(u => authService.sanitizeUser(u, requesterId)).filter(u => u !== null);

      res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: sanitizedUsers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get users',
        data: null
      });
    }
  }

  async sendRequest(req: AuthRequest, res: Response) {
    try {
      const { targetId } = req.params;
      const fromUserId = req.user?.id || req.user?.userId;

      if (!fromUserId) throw new Error('Unauthorized');

      await authService.sendNetworkRequest(fromUserId, targetId);

      res.json({
        success: true,
        message: 'Network request sent successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send network request'
      });
    }
  }

  async approveRequest(req: AuthRequest, res: Response) {
    try {
      const { requesterId } = req.params;
      const userId = req.user?.id || req.user?.userId;

      if (!userId) throw new Error('Unauthorized');

      await authService.approveNetworkRequest(userId, requesterId);

      res.json({
        success: true,
        message: 'Network request approved'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to approve network request'
      });
    }
  }

  async rejectRequest(req: AuthRequest, res: Response) {
    try {
      const { requesterId } = req.params;
      const userId = req.user?.id || req.user?.userId;

      if (!userId) throw new Error('Unauthorized');

      await authService.rejectNetworkRequest(userId, requesterId);

      res.json({
        success: true,
        message: 'Network request rejected'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reject network request'
      });
    }
  }

  async getNetworkInfo(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id || req.user?.userId;

      if (!userId) throw new Error('Unauthorized');

      const info = await authService.getNetworkInfo(userId);

      res.json({
        success: true,
        data: info
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get network info'
      });
    }
  }

  async removeConnection(req: AuthRequest, res: Response) {
    try {
      const { targetId } = req.params;
      const userId = req.user?.id || req.user?.userId;

      if (!userId) throw new Error('Unauthorized');

      await authService.removeNetworkConnection(userId, targetId);

      res.json({
        success: true,
        message: 'Network connection removal requested'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to remove network connection'
      });
    }
  }

  async approveRemoval(req: AuthRequest, res: Response) {
    try {
      const { requesterId } = req.params;
      const userId = req.user?.id || req.user?.userId;

      if (!userId) throw new Error('Unauthorized');

      await authService.approveNetworkRemoval(userId, requesterId);

      res.json({
        success: true,
        message: 'Network connection removed'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to approve network removal'
      });
    }
  }

  async rejectRemoval(req: AuthRequest, res: Response) {
    try {
      const { requesterId } = req.params;
      const userId = req.user?.id || req.user?.userId;

      if (!userId) throw new Error('Unauthorized');

      await authService.rejectNetworkRemoval(userId, requesterId);

      res.json({
        success: true,
        message: 'Network removal request rejected'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reject network removal'
      });
    }
  }

  async cancelRequest(req: AuthRequest, res: Response) {
    try {
      const { targetId } = req.params;
      const userId = req.user?.id || req.user?.userId;

      if (!userId) throw new Error('Unauthorized');

      await authService.cancelNetworkRequest(userId, targetId);

      res.json({
        success: true,
        message: 'Network request cancelled'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to cancel network request'
      });
    }
  }

  async blockUser(req: AuthRequest, res: Response) {
    try {
      const { targetId } = req.params;
      const userId = req.user?.id || req.user?.userId;

      if (!userId) throw new Error('Unauthorized');

      await authService.blockUser(userId, targetId);

      res.json({
        success: true,
        message: 'User blocked successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to block user'
      });
    }
  }

  async unblockUser(req: AuthRequest, res: Response) {
    try {
      const { targetId } = req.params;
      const userId = req.user?.id || req.user?.userId;

      if (!userId) throw new Error('Unauthorized');

      await authService.unblockUser(userId, targetId);

      res.json({
        success: true,
        message: 'User unblocked successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to unblock user'
      });
    }
  }
}
