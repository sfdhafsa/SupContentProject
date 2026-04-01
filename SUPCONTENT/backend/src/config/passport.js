import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import pool from './db.js'; // note le .js pour les ES Modules
import dotenv from 'dotenv';

dotenv.config();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'supersecret',
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const res = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [jwt_payload.id]
      );

      if (res.rows.length > 0) {
        return done(null, res.rows[0]);
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

export default passport;