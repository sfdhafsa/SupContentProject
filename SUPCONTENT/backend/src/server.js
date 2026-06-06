import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth/auth.routes.js";
import userRoutes from "./routes/users/user.routes.js";
import followRoutes from "./routes/social/follows.routes.js";
import feedRoutes from "./routes/social/feed.routes.js";
import movieRoutes from "./routes/movies/movies.routes.js";
import reviewsRoutes from "./routes/reviews/reviews.routes.js";
import libraryRoutes from "./routes/library/library.routes.js";
import notificationRoutes from './routes/social/notifications.routes.js';
import moderationRoutes from "./routes/moderation/moderation.routes.js";
import adminRoutes from "./routes/admin/admin.routes.js";
import "./config/passport.js";
import "./config/google.strategy.js";
import { errorHandler } from "./middlewares/error.middleware.js";

// ← Nécessaire pour avoir __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const uploadRoot = path.join(__dirname, "..", "uploads");
const allowedOrigins = new Set([
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8082",
  "http://127.0.0.1:8082",
  "http://localhost:8083",
  "http://127.0.0.1:8083",
].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.get("/.well-known/appspecific/com.chrome.devtools.json", (_, res) => {
  res.status(204).end();
});

app.get("/auth/google", (_, res) => {
  res.redirect(302, "/api/auth/google");
});

// ← Sert les fichiers uploadés (avatars, etc.) publiquement
app.use("/uploads", express.static(uploadRoot));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/social/notifications", notificationRoutes);
app.use("/api/social/follow", followRoutes);
app.use("/api/social/feed", feedRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/moderation", moderationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", libraryRoutes);


app.get("/api/health", (_, res) => res.json({ status: "ok" }));
app.use(errorHandler);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
