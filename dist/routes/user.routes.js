"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const userController = new user_controller_1.UserController();
// Get user profile
router.get('/:id', auth_1.authMiddleware, userController.getUserProfile.bind(userController));
// Update user profile
router.put('/:id', auth_1.authMiddleware, userController.updateUserProfile.bind(userController));
router.patch('/:id', auth_1.authMiddleware, userController.updateUserProfile.bind(userController));
// Delete user account
router.delete('/:id', auth_1.authMiddleware, userController.deleteUserAccount.bind(userController));
// Get all users (admin)
router.get('/', auth_1.authMiddleware, userController.getAllUsers.bind(userController));
// Network routes
router.post('/network/request/:targetId', auth_1.authMiddleware, userController.sendRequest.bind(userController));
router.post('/network/approve/:requesterId', auth_1.authMiddleware, userController.approveRequest.bind(userController));
router.post('/network/reject/:requesterId', auth_1.authMiddleware, userController.rejectRequest.bind(userController));
router.post('/network/remove/:targetId', auth_1.authMiddleware, userController.removeConnection.bind(userController));
router.post('/network/remove-approve/:requesterId', auth_1.authMiddleware, userController.approveRemoval.bind(userController));
router.post('/network/remove-reject/:requesterId', auth_1.authMiddleware, userController.rejectRemoval.bind(userController));
router.post('/network/cancel/:targetId', auth_1.authMiddleware, userController.cancelRequest.bind(userController));
router.post('/network/block/:targetId', auth_1.authMiddleware, userController.blockUser.bind(userController));
router.post('/network/unblock/:targetId', auth_1.authMiddleware, userController.unblockUser.bind(userController));
router.get('/network/info', auth_1.authMiddleware, userController.getNetworkInfo.bind(userController));
exports.default = router;
