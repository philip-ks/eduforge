import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth";
import { studentRouter } from "./routes/student";
import { healthRouter } from "./routes/health";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN }));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.get("/", (_req, res) => res.send("EduForge Backend running"));
  app.use("/health", healthRouter);

  app.use("/api/auth", authRouter);
  app.use("/api/student", studentRouter);

  app.use(errorHandler);

  return app;
}