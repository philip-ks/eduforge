import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";
import { env } from "../config/env";
import { requireAuth, AuthedRequest } from "../middleware/auth";

// Export both names to avoid future mismatch
export const authRouter = Router();
export const router = authRouter;

/**
 * POST /api/auth/login
 */
authRouter.post("/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "email and password required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ ok: false, error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ ok: false, error: "Invalid credentials" });

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      institutionId: (user as any).institutionId ?? null,
    },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({
    ok: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      phone: user.phone,
      institutionId: (user as any).institutionId ?? null,
    },
  });
});

/**
 * GET /api/auth/me
 */
authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  return res.json({ ok: true, user: req.user });
});
