import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.error('authMiddleware: No token provided');
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.error('authMiddleware: Token verification failed');
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    console.log('authMiddleware: Token verified successfully', { userId: decoded?.userId });
    req.user = decoded;
    next();
  } catch (error: any) {
    console.error('authMiddleware: Authentication failed', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

export const corsHeaders = (req: Request, res: Response, next: NextFunction) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  res.header('Access-Control-Allow-Origin', frontendUrl);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};
