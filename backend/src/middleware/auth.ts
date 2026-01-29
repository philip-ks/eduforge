import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type AuthedRequest = Request & {
  user?: {
    id: string;
    email?: string;
    role?: string;
    institutionId?: string | null;
  };
};

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ ok: false, error: "Missing token" });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;

    req.user = {
      id: String(payload.sub || payload.id || ""),
      email: payload.email ? String(payload.email) : undefined,
      role: payload.role ? String(payload.role) : undefined,
      institutionId: payload.institutionId ?? null,
    };

    if (!req.user.id) return res.status(401).json({ ok: false, error: "Invalid token payload" });
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
}

export function requireRole(roles: string[]) {
  const allowed = roles.map((r) => r.toUpperCase());
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const role = (req.user?.role || "").toUpperCase();
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }
    next();
  };
}

/**
 * Institution access guard — your DB uses INSTITUTION_ADMIN.
 * We allow both to keep it future-proof.
 */
export function requireInstitution(req: AuthedRequest, res: Response, next: NextFunction) {
  const role = (req.user?.role || "").toUpperCase();
  if (!["INSTITUTION", "INSTITUTION_ADMIN"].includes(role)) {
    return res.status(403).json({ ok: false, error: "Institution access required" });
  }
  next();
}
