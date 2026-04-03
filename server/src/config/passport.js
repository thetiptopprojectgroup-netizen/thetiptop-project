import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/User.js';

const configurePassport = () => {
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Base URL du backend (sans slash final) pour construire les callbacks OAuth
  const rawBackend = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:5000';
  const backendUrl = String(rawBackend).trim().replace(/\/+$/, '');

  // Google (accepte aussi préfixe pour injection depuis secret K8s)
  const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.FB_GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.FB_GOOGLE_CLIENT_SECRET;
  if (googleClientId && googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: `${backendUrl}/api/auth/google/callback`,
          scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await User.findOne({
              $or: [{ googleId: profile.id }, { email: profile.emails[0].value }],
            });

            if (user) {
              if (!user.googleId) {
                user.googleId = profile.id;
                user.type_authentification = 'google';
                await user.save();
              }
              return done(null, user);
            }

            user = await User.create({
              googleId: profile.id,
              email: profile.emails[0].value,
              prenom: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'Utilisateur',
              nom: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || 'Google',
              avatar: profile.photos?.[0]?.value,
              isEmailVerified: true,
              type_authentification: 'google',
              date_consentement: new Date(),
            });
            done(null, user);
          } catch (err) {
            done(err, null);
          }
        }
      )
    );
  }

  // Facebook (accepte FACEBOOK_* ou FB_FACEBOOK_* pour injection depuis secret K8s avec --prefix=FB_)
  const facebookAppId = process.env.FACEBOOK_APP_ID || process.env.FB_FACEBOOK_APP_ID;
  const facebookAppSecret = process.env.FACEBOOK_APP_SECRET || process.env.FB_FACEBOOK_APP_SECRET;
  if (facebookAppId && facebookAppSecret) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: facebookAppId,
          clientSecret: facebookAppSecret,
          callbackURL: `${backendUrl}/api/auth/facebook/callback`,
          profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await User.findOne({
              $or: [{ facebookId: profile.id }, { email: profile.emails?.[0]?.value }],
            });

            if (user) {
              if (!user.facebookId) {
                user.facebookId = profile.id;
                user.type_authentification = 'facebook';
                await user.save();
              }
              return done(null, user);
            }

            user = await User.create({
              facebookId: profile.id,
              email: profile.emails?.[0]?.value || `${profile.id}@facebook.local`,
              prenom: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'Utilisateur',
              nom: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || 'Facebook',
              avatar: profile.photos?.[0]?.value,
              isEmailVerified: true,
              type_authentification: 'facebook',
              date_consentement: new Date(),
            });
            done(null, user);
          } catch (err) {
            done(err, null);
          }
        }
      )
    );
  }
};

export default configurePassport;
