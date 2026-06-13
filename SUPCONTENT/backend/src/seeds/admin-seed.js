import pool from "../config/db.js";

const ADMIN_USER = {
  username: "supmoviesAdmin",
  email: "supmoviesteam@gmail.com",
  passwordHash: "$2b$10$oGoDUrRpa2tlRh70XqHe0eKmVh9H/JaS.Rj5PlmkIz0ydxyV64Yai",
};

export async function runAdminSeed() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `ALTER TABLE users
       ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT TRUE,
       ADD COLUMN IF NOT EXISTS verification_token TEXT,
       ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP`
    );

    await client.query(
      `ALTER TABLE users
       ALTER COLUMN is_verified SET DEFAULT FALSE`
    );

    const { rows: roleRows } = await client.query(
      `INSERT INTO roles (name)
       VALUES ('ADMIN')
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    const adminRoleId = roleRows[0].id;

    const { rows: existingRows } = await client.query(
      `SELECT id
       FROM users
       WHERE email = $1 OR username = $2
       LIMIT 1`,
      [ADMIN_USER.email, ADMIN_USER.username]
    );

    let adminUserId = existingRows[0]?.id;

    if (!adminUserId) {
      const { rows: userRows } = await client.query(
        `INSERT INTO users (
           email,
           username,
           password_hash,
           is_verified,
           verification_token,
           verification_token_expires
         )
         VALUES ($1, $2, $3, TRUE, NULL, NULL)
         RETURNING id`,
        [ADMIN_USER.email, ADMIN_USER.username, ADMIN_USER.passwordHash]
      );

      adminUserId = userRows[0].id;
    } else {
      await client.query(
        `UPDATE users
         SET is_verified = TRUE,
             verification_token = NULL,
             verification_token_expires = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [adminUserId]
      );
    }

    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [adminUserId, adminRoleId]
    );

    await client.query("COMMIT");
    console.log("admin-seed completed");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
