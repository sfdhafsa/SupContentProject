const { Pool } = require("pg");
require("dotenv").config();

// Si on est dans Docker, override pour host 'database'
const isDocker = process.env.NODE_ENV === "docker";

const pool = new Pool({
  user: process.env.DB_USER || "supcontent",
  host: isDocker ? "database" : process.env.DB_HOST || "localhost",
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

module.exports = pool;