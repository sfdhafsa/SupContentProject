import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || "supcontent",
  host: process.env.DB_HOST || "database",
  database: process.env.DB_NAME || "supcontent",
  password: process.env.DB_PASSWORD || "supcontent123",
  port: process.env.DB_PORT || 5432,
});

const wait = (durationMs) =>
  new Promise((resolve) => setTimeout(resolve, durationMs));

export const waitForDatabase = async ({
  retries = 15,
  delayMs = 2000,
} = {}) => {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query("SELECT 1");
      console.log("PostgreSQL is ready");
      return;
    } catch (error) {
      lastError = error;
      console.warn(
        `PostgreSQL unavailable (attempt ${attempt}/${retries}). Retrying in ${delayMs}ms...`
      );

      if (attempt < retries) {
        await wait(delayMs);
      }
    }
  }

  throw lastError;
};

pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL connection error:", err);
});

export default pool;
