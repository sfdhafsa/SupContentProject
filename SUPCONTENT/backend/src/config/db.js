import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || "supcontent",
  host: process.env.DB_HOST || "database",
  database: process.env.DB_NAME || "supcontent",
  password: process.env.DB_PASSWORD || "supcontent123",
  port: process.env.DB_PORT || 5432,
});

pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL connection error:", err);
});

export default pool;