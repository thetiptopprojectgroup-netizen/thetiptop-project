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

  // Google
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: '/api/auth/google/callback',
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
              prenom: profile.name.givenName,
              nom: profile.name.familyName,
              avatar: profile.photos[0]?.value,
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

  // Facebook
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: '/api/auth/facebook/callback',
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
              prenom: profile.name.givenName,
              nom: profile.name.familyName,
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
