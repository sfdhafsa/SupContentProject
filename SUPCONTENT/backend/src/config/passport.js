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

// ── Helper partagé ───────────────────────────────────────────────
// async function handleOAuthLogin({ provider, providerId, email, displayName, avatarUrl }, done) {
//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');
//
//     const { rows: oauthRows } = await client.query(
//       `SELECT u.* FROM users u
//        JOIN oauth_accounts oa ON oa.user_id = u.id
//        WHERE oa.provider = $1 AND oa.provider_user_id = $2`,
//       [provider, providerId]
//     );
//     if (oauthRows.length > 0) {
//       await client.query('COMMIT');
//       return done(null, oauthRows[0]);
//     }
//
//     let user;
//     if (email) {
//       const { rows: emailRows } = await client.query(
//         'SELECT * FROM users WHERE email = $1',
//         [email]
//       );
//       if (emailRows.length > 0) user = emailRows[0];
//     }
//
//     if (!user) {
//       const username = await generateUniqueUsername(client, displayName);
//       const { rows: newRows } = await client.query(
//         `INSERT INTO users (email, username, avatar_url)
//          VALUES ($1, $2, $3)
//          RETURNING *`,
//         [email || null, username, avatarUrl || null]
//       );
//       user = newRows[0];
//
//       const { rows: roleRows } = await client.query(
//         `SELECT id FROM roles WHERE name = 'USER'`
//       );
//       if (roleRows[0]) {
//         await client.query(
//           `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
//           [user.id, roleRows[0].id]
//         );
//       }
//     }
//
//     await client.query(
//       `INSERT INTO oauth_accounts (user_id, provider, provider_user_id)
//        VALUES ($1, $2, $3)
//        ON CONFLICT DO NOTHING`,
//       [user.id, provider, providerId]
//     );
//
//     await client.query('COMMIT');
//     return done(null, user);
//   } catch (err) {
//     await client.query('ROLLBACK');
//     return done(err, false);
//   } finally {
//     client.release();
//   }
// }

// ── Helper username unique ───────────────────────────────────────
// async function generateUniqueUsername(client, displayName) {
//   const base = (displayName || 'user')
//     .toLowerCase()
//     .replace(/[^a-z0-9]/g, '')
//     .slice(0, 20) || 'user';
//
//   let username = base;
//   let i = 1;
//   while (true) {
//     const { rows } = await client.query(
//       'SELECT id FROM users WHERE username = $1',
//       [username]
//     );
//     if (rows.length === 0) return username;
//     username = `${base}${i++}`;
//   }
// }

// ── Google ── décommentez quand vous avez les credentials ────────
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID:     process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL:  process.env.GOOGLE_CALLBACK_URL,
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       await handleOAuthLogin({
//         provider:    'google',
//         providerId:  profile.id,
//         email:       profile.emails?.[0]?.value,
//         displayName: profile.displayName,
//         avatarUrl:   profile.photos?.[0]?.value,
//       }, done);
//     }
//   )
// );

// ── GitHub ── décommentez quand vous avez les credentials ────────
// passport.use(
//   new GitHubStrategy(
//     {
//       clientID:     process.env.GITHUB_CLIENT_ID,
//       clientSecret: process.env.GITHUB_CLIENT_SECRET,
//       callbackURL:  process.env.GITHUB_CALLBACK_URL,
//       scope:        ['user:email'],
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       await handleOAuthLogin({
//         provider:    'github',
//         providerId:  String(profile.id),
//         email:       profile.emails?.[0]?.value,
//         displayName: profile.displayName || profile.username,
//         avatarUrl:   profile.photos?.[0]?.value,
//       }, done);
//     }
//   )
// );

// ── Facebook ── décommentez quand vous avez les credentials ──────
// passport.use(
//   new FacebookStrategy(
//     {
//       clientID:      process.env.FACEBOOK_APP_ID,
//       clientSecret:  process.env.FACEBOOK_APP_SECRET,
//       callbackURL:   process.env.FACEBOOK_CALLBACK_URL,
//       profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       await handleOAuthLogin({
//         provider:    'facebook',
//         providerId:  profile.id,
//         email:       profile.emails?.[0]?.value,
//         displayName: profile.displayName,
//         avatarUrl:   profile.photos?.[0]?.value,
//       }, done);
//     }
//   )
// );

export default passport;