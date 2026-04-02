import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import pool from './db.js';

// Plus de dotenv.config() ici — déjà géré par env.js au démarrage
import dotenv from 'dotenv';
dotenv.config();
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,   // plus de fallback || 'supersecret'
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, email, username, avatar_url, bio,
                is_banned, theme_preference, language_preference
         FROM users WHERE id = $1`,
        [jwt_payload.sub]
      );

      if (rows.length === 0) return done(null, false);

      const user = rows[0];

      if (user.is_banned)
        return done(null, false, { message: 'Compte suspendu.' });

      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  })
);

export default passport;

