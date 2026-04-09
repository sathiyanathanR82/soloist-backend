import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class UserController {
    getUserProfile(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateUserProfile(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteUserAccount(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getAllUsers(req: AuthRequest, res: Response): Promise<void>;
    sendRequest(req: AuthRequest, res: Response): Promise<void>;
    approveRequest(req: AuthRequest, res: Response): Promise<void>;
    rejectRequest(req: AuthRequest, res: Response): Promise<void>;
    getNetworkInfo(req: AuthRequest, res: Response): Promise<void>;
}
