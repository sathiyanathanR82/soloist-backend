import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const userController = new UserController();

// Get user profile
router.get('/:id', authMiddleware, userController.getUserProfile.bind(userController));

// Update user profile
router.put('/:id', authMiddleware, userController.updateUserProfile.bind(userController));

// Delete user account
router.delete('/:id', authMiddleware, userController.deleteUserAccount.bind(userController));

// Get all users (admin)
router.get('/', authMiddleware, userController.getAllUsers.bind(userController));

export default router;
