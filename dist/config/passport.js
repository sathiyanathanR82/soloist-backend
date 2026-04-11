"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_facebook_1 = require("passport-facebook");
const passport_microsoft_1 = require("passport-microsoft");
const passport_oauth2_1 = require("passport-oauth2");
const axios_1 = __importDefault(require("axios"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const authService = require('../services/auth.service').AuthService;
const service = new authService();
// Facebook Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport_1.default.use(new passport_facebook_1.Strategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: (process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000') + '/api/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'email', 'picture', 'first_name', 'last_name']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const { user, token, isNewUser } = await service.findOrCreateUser({
                ...profile,
                accessToken,
                refreshToken,
                emails: profile.emails
            }, 'facebook');
            return done(null, { user, token, isNewUser });
        }
        catch (error) {
            return done(error);
        }
    }));
}
// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: (process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000') + '/api/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const { user, token, isNewUser } = await service.findOrCreateUser({
                ...profile,
                accessToken,
                refreshToken,
                emails: profile.emails
            }, 'google');
            return done(null, { user, token, isNewUser });
        }
        catch (error) {
            return done(error);
        }
    }));
}
// Microsoft Strategy
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    passport_1.default.use(new passport_microsoft_1.Strategy({
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: (process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3000') + '/api/auth/microsoft/callback',
        scope: ['user.read', 'mail.read'],
        tenant: process.env.MICROSOFT_TENANT || 'common'
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const { user, token, isNewUser } = await service.findOrCreateUser({
                ...profile,
                accessToken,
                refreshToken,
                emails: profile.emails
            }, 'microsoft');
            return done(null, { user, token, isNewUser });
        }
        catch (error) {
            return done(error, undefined);
        }
    }));
}
// Yahoo Strategy (Manual OAuth2/OIDC)
if (process.env.YAHOO_CLIENT_ID && process.env.YAHOO_CLIENT_SECRET) {
    const yahooStrategy = new passport_oauth2_1.Strategy({
        authorizationURL: 'https://api.login.yahoo.com/oauth2/request_auth',
        tokenURL: 'https://api.login.yahoo.com/oauth2/get_token',
        clientID: process.env.YAHOO_CLIENT_ID,
        clientSecret: process.env.YAHOO_CLIENT_SECRET,
        callbackURL: (process.env.YAHOO_CALLBACK_URL || 'http://localhost:3000') + '/api/auth/yahoo/callback',
        scope: ['openid', 'profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const { user, token, isNewUser } = await service.findOrCreateUser({
                ...profile,
                accessToken,
                refreshToken,
                emails: profile.emails
            }, 'yahoo');
            return done(null, { user, token, isNewUser });
        }
        catch (error) {
            return done(error, undefined);
        }
    });
    // Yahoo Profile Fetcher (OIDC)
    yahooStrategy.userProfile = function (accessToken, done) {
        axios_1.default.get('https://api.login.yahoo.com/openid/v1/userinfo', {
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
    passport_1.default.use('yahoo', yahooStrategy);
}
// Serialize user
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
// Deserialize user
passport_1.default.deserializeUser((user, done) => {
    done(null, user);
});
exports.default = passport_1.default;
