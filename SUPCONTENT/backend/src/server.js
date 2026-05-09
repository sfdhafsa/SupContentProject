import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import passport from "passport";
import authRoutes from "./routes/auth/auth.routes.js";
import userRoutes from "./routes/users/user.routes.js";
import followRoutes from "./routes/social/follows.routes.js";
import movieRoutes from "./routes/movies/movies.routes.js";
import reviewsRoutes from "./routes/reviews/reviews.routes.js";
import libraryRoutes from "./routes/library/library.routes.js";
import "./config/passport.js";
import "./config/google.strategy.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/social/follow", followRoutes);
app.use("/api/social/comment",commentRouter);
app.use("/api/social/like",likeRouter);
app.use("/api/movies", movieRoutes);
app.use("/api/reviews",reviewsRoutes);
app.use("/api", libraryRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok" }));
app.use(errorHandler);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));