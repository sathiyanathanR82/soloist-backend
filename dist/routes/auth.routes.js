"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
// Facebook OAuth
router.get('/facebook', passport_1.default.authenticate('facebook', { scope: ['email', 'public_profile'] }));
router.get('/facebook/callback', passport_1.default.authenticate('facebook', { failureRedirect: '/' }), (req, res) => {
    const token = req.user.token;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    res.redirect(`${frontendUrl}/profile?token=${token}`);
});
// LinkedIn OAuth
router.get('/linkedin', passport_1.default.authenticate('linkedin', { scope: ['r_emailaddress', 'r_liteprofile'] }));
router.get('/linkedin/callback', passport_1.default.authenticate('linkedin', { failureRedirect: '/' }), (req, res) => {
    const token = req.user.token;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    res.redirect(`${frontendUrl}/profile?token=${token}`);
});
// Google OAuth
router.get('/google', passport_1.default.authenticate('google', { scope: ['email', 'profile'] }));
router.get('/google/callback', passport_1.default.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    const token = req.user.token;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    res.redirect(`${frontendUrl}/profile?token=${token}`);
});
// Microsoft OAuth
router.get('/microsoft', passport_1.default.authenticate('microsoft', { scope: ['user.read', 'mail.read'] }));
router.get('/microsoft/callback', passport_1.default.authenticate('microsoft', { failureRedirect: '/' }), (req, res) => {
    const token = req.user.token;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    res.redirect(`${frontendUrl}/profile?token=${token}`);
});
// Get current user
router.get('/me', auth_1.authMiddleware, authController.getCurrentUser.bind(authController));
// Logout
router.post('/logout', auth_1.authMiddleware, authController.logout.bind(authController));
exports.default = router;
