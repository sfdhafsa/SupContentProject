/* eslint-disable no-undef */
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy }   from 'passport-google-oauth20';
// import { Strategy as GitHubStrategy }   from 'passport-github2';
// import { Strategy as FacebookStrategy } from 'passport-facebook';
import pool from './db.js';

// ── JWT ─────────────────────────────────────────────────────────
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey:    process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try { 
      console.log("JWT PAYLOAD:", jwt_payload);
      const { rows } = await pool.query(
        `SELECT id, email, username, avatar_url, bio,
                is_banned, theme_preference, language_preference
         FROM users WHERE id = $1`,
        [jwt_payload.sub]
      );
      if (rows.length === 0) return done(null, false);
      if (rows[0].is_banned) return done(null, false, { message: 'Compte suspendu.' });
      return done(null, rows[0]);
    } catch (err) {
      return done(err, false);
    }
  })
);

export default passport;
