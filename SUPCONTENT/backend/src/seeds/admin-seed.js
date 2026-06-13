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
        `INSERT INTO users (email, username, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [ADMIN_USER.email, ADMIN_USER.username, ADMIN_USER.passwordHash]
      );

      adminUserId = userRows[0].id;
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
