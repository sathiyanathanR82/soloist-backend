import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const userController = new UserController();

// Get user profile
router.get('/:id', authMiddleware, userController.getUserProfile.bind(userController));

// Update user profile
router.put('/:id', authMiddleware, userController.updateUserProfile.bind(userController));
router.patch('/:id', authMiddleware, userController.updateUserProfile.bind(userController));

// Delete user account
router.delete('/:id', authMiddleware, userController.deleteUserAccount.bind(userController));

// Get all users (admin)
router.get('/', authMiddleware, userController.getAllUsers.bind(userController));

// Network routes
router.post('/network/request/:targetId', authMiddleware, userController.sendRequest.bind(userController));
router.post('/network/approve/:requesterId', authMiddleware, userController.approveRequest.bind(userController));
router.post('/network/reject/:requesterId', authMiddleware, userController.rejectRequest.bind(userController));
router.post('/network/remove/:targetId', authMiddleware, userController.removeConnection.bind(userController));
router.post('/network/remove-approve/:requesterId', authMiddleware, userController.approveRemoval.bind(userController));
router.post('/network/remove-reject/:requesterId', authMiddleware, userController.rejectRemoval.bind(userController));
router.post('/network/cancel/:targetId', authMiddleware, userController.cancelRequest.bind(userController));
router.post('/network/block/:targetId', authMiddleware, userController.blockUser.bind(userController));
router.post('/network/unblock/:targetId', authMiddleware, userController.unblockUser.bind(userController));
router.get('/network/info', authMiddleware, userController.getNetworkInfo.bind(userController));

export default router;
