import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME || "supcontent",
  process.env.DB_USER || "supcontent",
  process.env.DB_PASSWORD || "supcontent123",
  {
    host: process.env.DB_HOST || "database",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Test connexion
sequelize
  .authenticate()
  .then(() => console.log("✅ Connected to PostgreSQL via Sequelize"))
  .catch((err) => console.error("❌ DB connection error:", err));

export default sequelize;