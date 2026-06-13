import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { UserModel } from "../models/user.model.js";
import pool from "../config/db.js";

const normalizeUsername = (value, fallback) => {
  const base = (value || fallback || "google-user")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return base.length >= 3 ? base : `user_${base}`;
};

const buildUniqueUsername = async (displayName, email, providerUserId) => {
  const emailName = email?.split("@")[0];
  const base = normalizeUsername(displayName, emailName);
  let username = base;
  let suffix = 0;

  while (true) {
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE username=$1",
      [username]
    );

    if (rows.length === 0) {
      return username;
    }

    suffix += 1;
    username = `${base}_${String(providerUserId).slice(-6)}${suffix > 1 ? `_${suffix}` : ""}`;
  }
};

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
        await UserModel.ensureEmailVerificationColumns();

        const provider = "google";
        const providerUserId = profile.id;
        const email = profile.emails?.[0]?.value;
        const avatarUrl = profile.photos?.[0]?.value;

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

        // 2. LINK EXISTING EMAIL OR CREATE USER IF NOT FOUND
        if (!user) {
          const existingUser = email
            ? await pool.query(`SELECT * FROM users WHERE email=$1`, [email])
            : { rows: [] };

          if (existingUser.rows.length > 0) {
            user = existingUser.rows[0];

            if (!user.is_verified || (!user.avatar_url && avatarUrl)) {
              const updated = await pool.query(
                `UPDATE users
                 SET avatar_url=COALESCE(avatar_url, $1),
                     is_verified=TRUE,
                     verification_token=NULL,
                     verification_token_expires=NULL,
                     updated_at=NOW()
                 WHERE id=$2
                 RETURNING *`,
                [avatarUrl, user.id]
              );
              user = updated.rows[0];
            }
          } else {
            const username = await buildUniqueUsername(
              profile.displayName,
              email,
              providerUserId
            );

            const newUser = await pool.query(
              `INSERT INTO users (email, username, avatar_url, is_verified)
               VALUES ($1, $2, $3, TRUE)
               RETURNING *`,
              [email, username, avatarUrl]
            );

            user = newUser.rows[0];

            // 4. DEFAULT ROLE
            const role = await pool.query(
              `SELECT id FROM roles WHERE LOWER(name) = 'user'`
            );

            if (role.rows[0]?.id) {
              await pool.query(
                `INSERT INTO user_roles (user_id, role_id)
                 VALUES ($1, $2)
                 ON CONFLICT DO NOTHING`,
                [user.id, role.rows[0].id]
              );
            }
          }

          // 3. LINK OAUTH ACCOUNT
          await pool.query(
            `INSERT INTO oauth_accounts (user_id, provider, provider_user_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (provider, provider_user_id) DO NOTHING`,
            [user.id, provider, providerUserId]
          );
        }

        if (user && !user.is_verified) {
          const verifiedUser = await pool.query(
            `UPDATE users
             SET is_verified=TRUE,
                 verification_token=NULL,
                 verification_token_expires=NULL,
                 updated_at=NOW()
             WHERE id=$1
             RETURNING *`,
            [user.id]
          );
          user = verifiedUser.rows[0];
        }

        if (user.is_banned) {
          return done(null, false, { message: "your account is banned" });
        }

        // 5. LOAD ROLES
        const roles = await pool.query(
          `SELECT LOWER(r.name) AS name
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
