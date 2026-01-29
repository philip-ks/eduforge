import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * Notes:
 * - This is intentionally auth-agnostic so it won't break your current setup.
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

  // If name is unique in schema, create will enforce; otherwise we do a soft de-dupe.
  const existing = await prisma.department.findFirst({ where: { name } });
  if (existing) return res.status(409).json({ error: "Department already exists", department: existing });

  const created = await prisma.department.create({ data: { name } });
  res.status(201).json(created);
});

router.put("/departments/:id", async (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body?.name ?? "").trim();
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });
  if (!name) return res.status(400).json({ error: "name is required" });

  const updated = await prisma.department.update({ where: { id }, data: { name } });
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
  const rows = await prisma.designation.findMany({ orderBy: { id: "asc" } });
  res.json(rows);
});

router.post("/designations", async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "name is required" });

  const existing = await prisma.designation.findFirst({ where: { name } });
  if (existing) return res.status(409).json({ error: "Designation already exists", designation: existing });

  const created = await prisma.designation.create({ data: { name } });
  res.status(201).json(created);
});

router.put("/designations/:id", async (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body?.name ?? "").trim();
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });
  if (!name) return res.status(400).json({ error: "name is required" });

  const updated = await prisma.designation.update({ where: { id }, data: { name } });
  res.json(updated);
});

router.delete("/designations/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

  await prisma.designation.delete({ where: { id } });
  res.status(204).send();
});

// ---------- Subjects ----------
router.get("/subjects", async (_req, res) => {
  const rows = await prisma.subject.findMany({ orderBy: { id: "asc" } });
  res.json(rows);
});

router.post("/subjects", async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  if (!name) return res.status(400).json({ error: "name is required" });

  const existing = await prisma.subject.findFirst({ where: { name } });
  if (existing) return res.status(409).json({ error: "Subject already exists", subject: existing });

  const created = await prisma.subject.create({ data: { name } });
  res.status(201).json(created);
});

router.put("/subjects/:id", async (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body?.name ?? "").trim();
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });
  if (!name) return res.status(400).json({ error: "name is required" });

  const updated = await prisma.subject.update({ where: { id }, data: { name } });
  res.json(updated);
});

router.delete("/subjects/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

  await prisma.subject.delete({ where: { id } });
  res.status(204).send();
});

export default router;
