import { PrismaClient } from "@prisma/client";
import { Response } from "express";

/**
 * Require a string field from the provided object. If missing or empty,
 * send a 400 error response and return undefined.
 */
export function requireField(
  res: Response,
  obj: any,
  field: string
): string | undefined {
  const val = obj?.[field];
  if (typeof val !== "string" || !val.trim()) {
    res.status(400).json({ ok: false, error: `${field} is required` });
    return undefined;
  }
  return val.trim();
}

/**
 * Ensure a department exists by ID. If not found, send 404 and return false.
 * Returns true if the department exists.
 */
export async function ensureDepartment(
  prisma: PrismaClient,
  res: Response,
  departmentId: string
): Promise<boolean> {
  const dept = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!dept) {
    res.status(404).json({ ok: false, error: "Department not found" });
    return false;
  }
  return true;
}

/**
 * Send a success JSON response. Defaults to HTTP 200.
 */
export function success(res: Response, data?: any, status: number = 200): void {
  res.status(status).json({ ok: true, data });
}

/**
 * Send a failure JSON response with the specified status and error message.
 */
export function fail(res: Response, status: number, error: string): void {
  res.status(status).json({ ok: false, error });
}
