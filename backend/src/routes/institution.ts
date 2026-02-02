import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { RequestStatus } from "@prisma/client";
import { success, fail } from "../utils/helpers";

export const institutionRouter = Router();

/**
 * Hard-guard inside the route module (no dependency on requireInstitution export/import).
 * Allowed institution roles:
 * - INSTITUTION
 * - INSTITUTION_ADMIN
 */
function institutionGuard(req: AuthedRequest, res: any, next: any) {
  const role = String(req.user?.role || "").toUpperCase();
  if (!["INSTITUTION", "INSTITUTION_ADMIN"].includes(role)) {
    return fail(res, 403, "Forbidden");
  }
  next();
}

institutionRouter.use(requireAuth, institutionGuard);

function getInstitutionId(req: AuthedRequest) {
  const institutionId = (req.user as any)?.institutionId;
  return institutionId ? String(institutionId) : null;
}

function pickRequestModel() {
  // support older/newer schema naming
  return (prisma as any).request ?? (prisma as any).studentRequest ?? null;
}

function parseRequestStatus(raw: unknown): RequestStatus | null {
  const s = String(raw || "").trim().toUpperCase();
  if (!s) return null;

  // Accept common frontend term "PENDING" as alias of OPEN
  if (s === "PENDING") return RequestStatus.OPEN;

  if (s === "OPEN") return RequestStatus.OPEN;
  if (s === "IN_PROGRESS") return RequestStatus.IN_PROGRESS;
  if (s === "CLOSED") return RequestStatus.CLOSED;

  return null;
}

institutionRouter.get("/overview", async (req: AuthedRequest, res) => {
  const institutionId = getInstitutionId(req);

  const whereStudents: any = { role: "STUDENT" };
  if (institutionId) whereStudents.institutionId = institutionId;

  const requestModel = pickRequestModel();

  const whereReqBase: any = {};
  if (institutionId) whereReqBase.institutionId = institutionId;

  const [students, requestsPending, requestsTotal] = await Promise.all([
    prisma.user.count({ where: whereStudents }),
    requestModel?.count
      ? requestModel.count({
          where: { ...whereReqBase, status: RequestStatus.OPEN },
        })
      : Promise.resolve(0),
    requestModel?.count ? requestModel.count({ where: whereReqBase }) : Promise.resolve(0),
  ]);

  return success(res, {
    institutionId,
    students,
    requestsPending,
    requestsTotal,
  });
});

institutionRouter.get("/students", async (req: AuthedRequest, res) => {
  const institutionId = getInstitutionId(req);
  const q = String(req.query.q || "").trim();

  const where: any = { role: "STUDENT" };
  if (institutionId) where.institutionId = institutionId;

  if (q) {
    where.OR = [{ email: { contains: q, mode: "insensitive" } }];
  }

  const rows = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, email: true, role: true, phone: true, createdAt: true },
  });

  return success(res, rows);
});

institutionRouter.get("/requests", async (req: AuthedRequest, res) => {
  const institutionId = getInstitutionId(req);

  // Default to OPEN (pending)
  const statusParsed =
    parseRequestStatus(req.query.status) ?? RequestStatus.OPEN;

  const requestModel = pickRequestModel();
  if (!requestModel?.findMany) return success(res, []);

  const where: any = { status: statusParsed };
  if (institutionId) where.institutionId = institutionId;

  const rows = await requestModel.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return success(res, rows);
});
