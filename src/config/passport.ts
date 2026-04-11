import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';

import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { Strategy as YahooStrategy } from 'passport-oauth2';
import axios from 'axios';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';

const authService = require('../services/auth.service').AuthService;
const service = new authService();

// Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
 callbackURL: (process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000') + '/api/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'email', 'picture', 'first_name', 'last_name']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const { user, token, isNewUser } = await service.findOrCreateUser(
        {
          ...profile,
          accessToken,
          refreshToken,
          emails: profile.emails
        },
        'facebook'
      );

      return done(null, { user, token, isNewUser });
    } catch (error) {
      return done(error);
    }
  }));
}


// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
 callbackURL: (process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000') + '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const { user, token, isNewUser } = await service.findOrCreateUser(
        {
          ...profile,
          accessToken,
          refreshToken,
          emails: profile.emails
        },
        'google'
      );

      return done(null, { user, token, isNewUser });
    } catch (error) {
      return done(error);
    }
  }));
}

// Microsoft Strategy
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
callbackURL: (process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3000') + '/api/auth/microsoft/callback',
    scope: ['user.read', 'mail.read'],
    tenant: process.env.MICROSOFT_TENANT || 'common'
  }, async (accessToken: any, refreshToken: any, profile: { emails: any; }, done: (arg0: unknown, arg1: { user: any; token: any; isNewUser: boolean; } | undefined) => any) => {
    try {
      const { user, token, isNewUser } = await service.findOrCreateUser(
        {
          ...profile,
          accessToken,
          refreshToken,
          emails: profile.emails
        },
        'microsoft'
      );

      return done(null, { user, token, isNewUser });
    } catch (error) {
      return done(error, undefined);
    }
  }));
}

// Yahoo Strategy (Manual OAuth2/OIDC)
if (process.env.YAHOO_CLIENT_ID && process.env.YAHOO_CLIENT_SECRET) {
  const yahooStrategy = new YahooStrategy({
    authorizationURL: 'https://api.login.yahoo.com/oauth2/request_auth',
    tokenURL: 'https://api.login.yahoo.com/oauth2/get_token',
    clientID: process.env.YAHOO_CLIENT_ID,
    clientSecret: process.env.YAHOO_CLIENT_SECRET,
callbackURL: (process.env.YAHOO_CALLBACK_URL || 'http://localhost:3000') + '/api/auth/yahoo/callback',
    scope: ['openid', 'profile', 'email']
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      const { user, token, isNewUser } = await service.findOrCreateUser(
        {
          ...profile,
          accessToken,
          refreshToken,
          emails: profile.emails
        },
        'yahoo'
      );

      return done(null, { user, token, isNewUser });
    } catch (error) {
      return done(error, undefined);
    }
  });

  // Yahoo Profile Fetcher (OIDC)
  yahooStrategy.userProfile = function (accessToken: string, done: (err?: any, profile?: any) => void) {
    axios.get('https://api.login.yahoo.com/openid/v1/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
      .then(response => {
        const data = response.data;
        const profile = {
          id: data.sub,
          displayName: data.name || `${data.given_name} ${data.family_name}`,
          name: {
            familyName: data.family_name,
            givenName: data.given_name
          },
          emails: [{ value: data.email, verified: data.email_verified }],
          photos: [{ value: data.picture }],
          _raw: JSON.stringify(data),
          _json: data
        };
        done(null, profile);
      })
      .catch(err => {
        done(err);
      });
  };

  passport.use('yahoo', yahooStrategy);
}

// Serialize user
passport.serializeUser((user: any, done) => {
  done(null, user);
});

// Deserialize user
passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
