/* eslint-disable no-undef */
import pkg from "pg";
const { Pool } = pkg;

if (!process.env.DATABASE_URL && !process.env.DB_PASSWORD) {
  throw new Error("DATABASE_URL or DB_PASSWORD environment variable is required");
}

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
    }
  : {
      user: process.env.DB_USER || "supcontent",
      host: process.env.DB_HOST || "database",
      database: process.env.DB_NAME || "supcontent",
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

pool.on("connect", () => {
  console.log(" Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error(" PostgreSQL connection error:", err);
});

export default pool;
