import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireField, ensureDepartment, success, fail } from "../utils/helpers";
import { asyncHandler } from "../middleware/asyncHandler";

const router = Router();

/**
 * Notes:
 * - Auth-agnostic (wrap with auth middleware later if needed)
 * - All IDs treated as strings (cuid/uuid style)
 */

// ---------- Departments ----------
router.get(
  "/departments",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.department.findMany({ orderBy: { id: "asc" } });
    return success(res, rows);
  })
);

router.post(
  "/departments",
  asyncHandler(async (req, res) => {
    const name = requireField(res, req.body, "name");
    if (!name) return;

    const existing = await prisma.department.findFirst({ where: { name } });
    if (existing) return fail(res, 409, "Department already exists");

    const created = await prisma.department.create({ data: { name } });
    return success(res, created, 201);
  })
);

router.put(
  "/departments/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id).trim();
    if (!id) return fail(res, 400, "invalid id");

    const name = requireField(res, req.body, "name");
    if (!name) return;

    const updated = await prisma.department.update({
      where: { id },
      data: { name },
    });

    return success(res, updated);
  })
);

router.delete(
  "/departments/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id).trim();
    if (!id) return fail(res, 400, "invalid id");

    await prisma.department.delete({ where: { id } });
    return success(res, undefined, 204);
  })
);

// ---------- Designations ----------
router.get(
  "/designations",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.designation.findMany({ orderBy: { id: "asc" } });
    return success(res, rows);
  })
);

router.post(
  "/designations",
  asyncHandler(async (req, res) => {
    // Accept both `title` and legacy `name`
    const rawTitle = req.body?.title ?? req.body?.name;
    const title = requireField(res, { title: rawTitle }, "title");
    if (!title) return;

    const departmentId = requireField(res, req.body, "departmentId");
    if (!departmentId) return;

    const deptOk = await ensureDepartment(prisma, res, departmentId);
    if (!deptOk) return;

    const existing = await prisma.designation.findFirst({
      where: { title, departmentId },
    });
    if (existing) return fail(res, 409, "Designation already exists");

    const created = await prisma.designation.create({
      data: {
        title,
        department: { connect: { id: departmentId } },
      },
    });

    return success(res, created, 201);
  })
);

router.put(
  "/designations/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id).trim();
    if (!id) return fail(res, 400, "invalid id");

    const rawTitle = req.body?.title ?? req.body?.name;
    const titleCandidate =
      typeof rawTitle === "string" && rawTitle.trim().length
        ? rawTitle.trim()
        : undefined;

    const deptCandidate =
      typeof req.body?.departmentId === "string" && req.body.departmentId.trim().length
        ? req.body.departmentId.trim()
        : undefined;

    const data: { title?: string; department?: { connect: { id: string } } } = {};
    if (titleCandidate) data.title = titleCandidate;
    if (deptCandidate) data.department = { connect: { id: deptCandidate } };

    if (!data.title && !data.department) return fail(res, 400, "No fields to update");

    if (deptCandidate) {
      const deptOk = await ensureDepartment(prisma, res, deptCandidate);
      if (!deptOk) return;
    }

    const updated = await prisma.designation.update({
      where: { id },
      data,
    });

    return success(res, updated);
  })
);

router.delete(
  "/designations/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id).trim();
    if (!id) return fail(res, 400, "invalid id");

    await prisma.designation.delete({ where: { id } });
    return success(res, undefined, 204);
  })
);

// ---------- Subjects ----------
router.get(
  "/subjects",
  asyncHandler(async (_req, res) => {
    const rows = await prisma.subject.findMany({ orderBy: { id: "asc" } });
    return success(res, rows);
  })
);

router.post(
  "/subjects",
  asyncHandler(async (req, res) => {
    const name = requireField(res, req.body, "name");
    if (!name) return;

    const departmentId = requireField(res, req.body, "departmentId");
    if (!departmentId) return;

    const deptOk = await ensureDepartment(prisma, res, departmentId);
    if (!deptOk) return;

    const existing = await prisma.subject.findFirst({
      where: { name, departmentId },
    });
    if (existing) return fail(res, 409, "Subject already exists");

    const created = await prisma.subject.create({
      data: {
        name,
        department: { connect: { id: departmentId } },
      },
    });

    return success(res, created, 201);
  })
);

router.put(
  "/subjects/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id).trim();
    if (!id) return fail(res, 400, "invalid id");

    const rawName = req.body?.name;
    const nameCandidate =
      typeof rawName === "string" && rawName.trim().length
        ? rawName.trim()
        : undefined;

    const deptCandidate =
      typeof req.body?.departmentId === "string" && req.body.departmentId.trim().length
        ? req.body.departmentId.trim()
        : undefined;

    const data: { name?: string; department?: { connect: { id: string } } } = {};
    if (nameCandidate) data.name = nameCandidate;
    if (deptCandidate) data.department = { connect: { id: deptCandidate } };

    if (!data.name && !data.department) return fail(res, 400, "No fields to update");

    if (deptCandidate) {
      const deptOk = await ensureDepartment(prisma, res, deptCandidate);
      if (!deptOk) return;
    }

    const updated = await prisma.subject.update({
      where: { id },
      data,
    });

    return success(res, updated);
  })
);

router.delete(
  "/subjects/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id).trim();
    if (!id) return fail(res, 400, "invalid id");

    await prisma.subject.delete({ where: { id } });
    return success(res, undefined, 204);
  })
);

export default router;
