import pkg from "pg";
const { Pool } = pkg;

// Détection Docker
const isDocker = process.env.NODE_ENV === "docker";

const pool = new Pool({
  user: process.env.DB_USER || "supcontent",
  host: isDocker ? "database" : process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "supcontent",
  password: process.env.DB_PASSWORD || "supcontent123",
  port: process.env.DB_PORT || 5432,
});

// Logs
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL connection error:", err);
});

export default pool; // ✅ TRÈS IMPORTAN