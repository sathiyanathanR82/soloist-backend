import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  (req: any, res) => {
    const { token, isNewUser } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    res.redirect(`${frontendUrl}/profile?token=${token}&isNewUser=${isNewUser}`);
  }
);

// LinkedIn OAuth
router.get('/linkedin', passport.authenticate('linkedin', { scope: ['r_emailaddress', 'r_liteprofile'] }));

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/' }),
  (req: any, res) => {
    const { token, isNewUser } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    res.redirect(`${frontendUrl}/profile?token=${token}&isNewUser=${isNewUser}`);
  }
);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req: any, res) => {
    const { token, isNewUser } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    res.redirect(`${frontendUrl}/profile?token=${token}&isNewUser=${isNewUser}`);
  }
);

// Microsoft OAuth
router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read', 'mail.read'] }));

router.get('/microsoft/callback',
  passport.authenticate('microsoft', { failureRedirect: '/' }),
  (req: any, res) => {
    const { token, isNewUser } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    res.redirect(`${frontendUrl}/profile?token=${token}&isNewUser=${isNewUser}`);
  }
);

// Yahoo OAuth
router.get('/yahoo', passport.authenticate('yahoo', { scope: ['openid', 'profile', 'email'] }));

router.get('/yahoo/callback',
  passport.authenticate('yahoo', { failureRedirect: '/' }),
  (req: any, res) => {
    const { token, isNewUser } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    res.redirect(`${frontendUrl}/profile?token=${token}&isNewUser=${isNewUser}`);
  }
);

// Get current user
router.get('/me', authMiddleware, authController.getCurrentUser.bind(authController));

// Logout
router.post('/logout', authMiddleware, authController.logout.bind(authController));

export default router;
