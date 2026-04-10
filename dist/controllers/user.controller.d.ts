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
    removeConnection(req: AuthRequest, res: Response): Promise<void>;
    approveRemoval(req: AuthRequest, res: Response): Promise<void>;
    rejectRemoval(req: AuthRequest, res: Response): Promise<void>;
    cancelRequest(req: AuthRequest, res: Response): Promise<void>;
    blockUser(req: AuthRequest, res: Response): Promise<void>;
    unblockUser(req: AuthRequest, res: Response): Promise<void>;
}
