import { Router } from "express";
import { healthRouter } from "./health";
import { authRouter } from "./auth";
import { institutionRouter } from "./institution";
import { studentRouter } from "./student";

export const apiRouter = Router();

apiRouter.use(healthRouter);              // /api/health
apiRouter.use("/auth", authRouter);       // /api/auth/*
apiRouter.use("/institution", institutionRouter);
apiRouter.use("/student", studentRouter);
