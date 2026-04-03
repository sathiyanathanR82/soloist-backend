import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import { generateToken } from '../utils/jwt';

const authService = new AuthService();

export class AuthController {
  
  async handleOAuthCallback(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed'
        });
      }

      const { user, token } = req.user;

      res.json({
        success: true,
        message: 'Authentication successful',
        data: {
          user,
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'OAuth callback error',
        data: null
      });
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      console.log('getCurrentUser: userId from token:', userId);
      console.log('getCurrentUser: req.user:', req.user);

      if (!userId) {
        console.error('getCurrentUser: No userId found in token');
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
          data: null
        });
      }

      const user = await authService.getUserById(userId);
      console.log('getCurrentUser: user from database:', user);

      if (!user) {
        console.error('getCurrentUser: User not found in database for userId:', userId);
        return res.status(404).json({
          success: false,
          message: 'User not found',
          data: null
        });
      }

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error: any) {
      console.error('getCurrentUser error:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to get current user',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        data: null
      });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      res.json({
        success: true,
        message: 'Logged out successfully',
        data: null
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        data: null
      });
    }
  }
}
