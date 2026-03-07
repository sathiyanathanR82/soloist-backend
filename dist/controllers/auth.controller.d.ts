import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class AuthController {
    handleOAuthCallback(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getCurrentUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    logout(req: AuthRequest, res: Response): Promise<void>;
}
