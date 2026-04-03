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
exports.default = router;
