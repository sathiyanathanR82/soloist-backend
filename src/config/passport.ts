import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';

const authService = require('../services/auth.service').AuthService;
const service = new authService();

// Facebook Strategy
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID || '',
  clientSecret: process.env.FACEBOOK_APP_SECRET || '',
  callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/api/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'email', 'picture', 'first_name', 'last_name']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { user, token } = await service.findOrCreateUser(
      {
        ...profile,
        accessToken,
        refreshToken,
        emails: profile.emails
      },
      'facebook'
    );
    
    return done(null, { user, token });
  } catch (error) {
    return done(error);
  }
}));

// LinkedIn Strategy
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID || '',
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
  callbackURL: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3000/api/auth/linkedin/callback',
  scope: ['r_emailaddress', 'r_liteprofile']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { user, token } = await service.findOrCreateUser(
      {
        ...profile,
        accessToken,
        refreshToken,
        emails: profile.emails
      },
      'linkedin'
    );
    
    return done(null, { user, token });
  } catch (error) {
    return done(error);
  }
}));

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { user, token } = await service.findOrCreateUser(
      {
        ...profile,
        accessToken,
        refreshToken,
        emails: profile.emails
      },
      'google'
    );
    
    return done(null, { user, token });
  } catch (error) {
    return done(error);
  }
}));

// Microsoft Strategy
passport.use(new MicrosoftStrategy({
  clientID: process.env.MICROSOFT_CLIENT_ID || '',
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
  callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3000/api/auth/microsoft/callback',
  scope: ['user.read', 'mail.read']
}, async (accessToken: any, refreshToken: any, profile: { emails: any; }, done: (arg0: unknown, arg1: { user: any; token: any; } | undefined) => any) => {
  try {
    const { user, token } = await service.findOrCreateUser(
      {
        ...profile,
        accessToken,
        refreshToken,
        emails: profile.emails
      },
      'microsoft'
    );
    
    return done(null, { user, token });
  } catch (error) {
    return done(error, undefined);
  }
}));

// Serialize user
passport.serializeUser((user: any, done) => {
  done(null, user);
});

// Deserialize user
passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
