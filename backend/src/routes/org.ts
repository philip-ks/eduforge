import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * Notes:
 * - This is intentionally auth‑agnostic so it won't break your current setup.
 * - If you already have auth middleware, you can wrap routes later.
 */

// ---------- Departments ----------
router.get("/departments", async (_req, res) => {
  const rows = await prisma.department.findMany({ orderBy: { id: "asc" } });
  res.json(rows);
});

router.post("/departments", async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "name is required" });

  // If name is unique in schema, create will enforce; otherwise we do a soft de‑dupe.
  const existing = await prisma.department.findFirst({ where: { name } });
  if (existing)
    return res
      .status(409)
      .json({ error: "Department already exists", department: existing });

  const created = await prisma.department.create({ data: { name } });
  res.status(201).json(created);
});

router.put("/departments/:id", async (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body?.name ?? "").trim();
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });
  if (!name) return res.status(400).json({ error: "name is required" });

  const updated = await prisma.department.update({
    where: { id },
    data: { name },
  });
  res.json(updated);
});

router.delete("/departments/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

  await prisma.department.delete({ where: { id } });
  res.status(204).send();
});

// ---------- Designations ----------
router.get("/designations", async (_req, res) => {
  const rows = await prisma.designation.findMany({
    orderBy: { id: "asc" },
  });
  res.json(rows);
});

// POST a new designation. Requires a title and a departmentId.
router.post("/designations", async (req, res) => {
  // Accept both `title` and legacy `name` for backward compatibility.
  const rawTitle = req.body?.title ?? req.body?.name;
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const departmentId =
    typeof req.body?.departmentId === "string"
      ? req.body.departmentId.trim()
      : "";

  if (!title) return res.status(400).json({ error: "title is required" });
  if (!departmentId)
    return res.status(400).json({ error: "departmentId is required" });

  // Ensure the department exists
  const dept = await prisma.department.findUnique({
    where: { id: departmentId },
  });
  if (!dept) return res.status(404).json({ error: "Department not found" });

  // Prevent duplicate title within the same department
  const existing = await prisma.designation.findFirst({
    where: { title, departmentId },
  });
  if (existing)
    return res
      .status(409)
      .json({ error: "Designation already exists", designation: existing });

  const created = await prisma.designation.create({
    data: {
      title,
      department: { connect: { id: departmentId } },
    },
  });
  return res.status(201).json(created);
});

// PUT update designation. Allows updating title and/or departmentId.
router.put("/designations/:id", async (req, res) => {
  const id = String(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  const rawTitle = req.body?.title ?? req.body?.name;
  const title =
    typeof rawTitle === "string" && rawTitle.trim().length
      ? rawTitle.trim()
      : undefined;
  const rawDeptId = req.body?.departmentId;
  const departmentId =
    typeof rawDeptId === "string" && rawDeptId.trim().length
      ? rawDeptId.trim()
      : undefined;

  const data: any = {};
  if (title) data.title = title;
  if (departmentId) data.department = { connect: { id: departmentId } };

  if (!data.title && !data.department)
    return res
      .status(400)
      .json({ error: "No fields to update" });

  // If departmentId provided, ensure it exists
  if (data.department) {
    const deptExists = await prisma.department.findUnique({
      where: { id: departmentId! },
    });
    if (!deptExists) return res.status(404).json({ error: "Department not found" });
  }

  const updated = await prisma.designation.update({
    where: { id },
    data,
  });
  return res.json(updated);
});

router.delete("/designations/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

  await prisma.designation.delete({ where: { id } });
  res.status(204).send();
});

// ---------- Subjects ----------
router.get("/subjects", async (_req, res) => {
  const rows = await prisma.subject.findMany({
    orderBy: { id: "asc" },
  });
  res.json(rows);
});

// POST a new subject. Requires name and departmentId.
router.post("/subjects", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const departmentId =
    typeof req.body?.departmentId === "string"
      ? req.body.departmentId.trim()
      : "";

  if (!name) return res.status(400).json({ error: "name is required" });
  if (!departmentId)
    return res.status(400).json({ error: "departmentId is required" });

  const dept = await prisma.department.findUnique({
    where: { id: departmentId },
  });
  if (!dept) return res.status(404).json({ error: "Department not found" });

  const existing = await prisma.subject.findFirst({
    where: { name, departmentId },
  });
  if (existing)
    return res
      .status(409)
      .json({ error: "Subject already exists", subject: existing });

  const created = await prisma.subject.create({
    data: {
      name,
      department: { connect: { id: departmentId } },
    },
  });
  return res.status(201).json(created);
});

// PUT update subject. Allows updating name and/or departmentId.
router.put("/subjects/:id", async (req, res) => {
  const id = String(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid id" });

  const rawName = req.body?.name;
  const name =
    typeof rawName === "string" && rawName.trim().length
      ? rawName.trim()
      : undefined;
  const rawDeptId = req.body?.departmentId;
  const departmentId =
    typeof rawDeptId === "string" && rawDeptId.trim().length
      ? rawDeptId.trim()
      : undefined;

  const data: any = {};
  if (name) data.name = name;
  if (departmentId) data.department = { connect: { id: departmentId } };

  if (!data.name && !data.department)
    return res
      .status(400)
      .json({ error: "No fields to update" });

  if (data.department) {
    const deptExists = await prisma.department.findUnique({
      where: { id: departmentId! },
    });
    if (!deptExists) return res.status(404).json({ error: "Department not found" });
  }

  const updated = await prisma.subject.update({
    where: { id },
    data,
  });
  return res.json(updated);
});

router.delete("/subjects/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

  await prisma.subject.delete({ where: { id } });
  res.status(204).send();
});

export default router;
