import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "../config/db.js";
import { UserModel } from "../models/user.model.js";

console.log("🚀 GOOGLE STRATEGY LOADED");

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/auth/google/callback",
      passReqToCallback: true,
      proxy: true,
    },

    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const provider = "google";
        const providerUserId = profile.id;
        const email = profile.emails?.[0]?.value;

        let user;

        // =========================
        // 1. CHECK oauth_accounts
        // =========================
        const oauthResult = await pool.query(
          `SELECT user_id 
           FROM oauth_accounts 
           WHERE provider = $1 AND provider_user_id = $2`,
          [provider, providerUserId]
        );

        if (oauthResult.rows.length > 0) {
          // EXISTING LINK → LOGIN USER
          user = await UserModel.findById(oauthResult.rows[0].user_id);
        }

        // =========================
        // 2. IF NOT LINKED → CHECK EMAIL
        // =========================
        if (!user) {
          user = await UserModel.findByEmail(email);

          // =========================
          // 3. CREATE USER IF NOT EXISTS
          // =========================
          if (!user) {
            user = await UserModel.createLocal({
              email,
              username: profile.displayName,
              passwordHash: null,
            });
          }

          // =========================
          // 4. LINK oauth_accounts
          // =========================
          await pool.query(
            `INSERT INTO oauth_accounts 
              (user_id, provider, provider_user_id)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [user.id, provider, providerUserId]
          );
        }

        // =========================
        // 5. ENSURE DEFAULT ROLE
        // =========================
        await UserModel.ensureDefaultRole(user.id);

        // =========================
        // 6. LOAD ROLES (RBAC)
        // =========================
        const roles = await UserModel.findRolesByUserId(user.id);
        user.roles = roles;

        return done(null, user);
      } catch (err) {
        console.error("Google OAuth error:", err);
        return done(err, null);
      }
    }
  )
);