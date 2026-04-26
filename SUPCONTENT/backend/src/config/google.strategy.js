import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "../config/db.js";

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const provider = "google";
        const providerUserId = profile.id;
        const email = profile.emails?.[0]?.value;

        // 1. CHECK LINK
        const oauth = await pool.query(
          `SELECT user_id FROM oauth_accounts
           WHERE provider=$1 AND provider_user_id=$2`,
          [provider, providerUserId]
        );

        let user;

        if (oauth.rows.length > 0) {
          user = await pool.query(
            `SELECT * FROM users WHERE id=$1`,
            [oauth.rows[0].user_id]
          );
          user = user.rows[0];
        }

        // 2. CREATE USER IF NOT FOUND
        if (!user) {
          const newUser = await pool.query(
            `INSERT INTO users (email, username, avatar_url)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [email, profile.displayName, profile.photos?.[0]?.value]
          );

          user = newUser.rows[0];

          // 3. LINK OAUTH ACCOUNT
          await pool.query(
            `INSERT INTO oauth_accounts (user_id, provider, provider_user_id)
             VALUES ($1, $2, $3)`,
            [user.id, provider, providerUserId]
          );

          // 4. DEFAULT ROLE
          const role = await pool.query(
            `SELECT id FROM roles WHERE name='USER'`
          );

          await pool.query(
            `INSERT INTO user_roles (user_id, role_id)
             VALUES ($1, $2)`,
            [user.id, role.rows[0].id]
          );
        }

        // 5. LOAD ROLES
        const roles = await pool.query(
          `SELECT r.name
           FROM roles r
           JOIN user_roles ur ON ur.role_id = r.id
           WHERE ur.user_id=$1`,
          [user.id]
        );

        user.roles = roles.rows.map(r => r.name);

        return done(null, user);

      } catch (err) {
        console.error("Google OAuth error:", err);
        return done(err, null);
      }
    }
  )
);