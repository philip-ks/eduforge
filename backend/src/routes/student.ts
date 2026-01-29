import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { prisma } from "../utils/prisma";
import { HttpError } from "../utils/httpError";
import { nextRequestDisplayId } from "../services/requestId";

export const studentRouter = Router();

// All student endpoints require auth
studentRouter.use(requireAuth);

function ensureStudent(req: AuthedRequest): string {
  const sid = req.user?.studentId;
  if (!sid) throw new HttpError(403, "Not a student account");
  return sid;
}

// GET /api/student/profile
studentRouter.get("/profile", async (req: AuthedRequest, res, next) => {
  try {
    const studentId = ensureStudent(req);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { program: true },
    });
    if (!student) throw new HttpError(404, "Student not found");

    const user = await prisma.user.findUnique({ where: { id: student.userId } });

    res.json({
      studentId: student.id,
      displayId: student.displayId,
      name: student.fullName,
      program: { id: student.program.id, name: student.program.name },
      semester: student.semester,
      email: user?.email ?? null,
      phone: user?.phone ?? null,
    });
  } catch (e) { next(e); }
});

// GET /api/student/settings
studentRouter.get("/settings", async (req: AuthedRequest, res, next) => {
  try {
    const studentId = ensureStudent(req);

    const settings = await prisma.studentSetting.findUnique({ where: { studentId } });
    if (!settings) throw new HttpError(404, "Settings not found");

    res.json({
      theme: settings.theme,
      notifications: settings.notificationsEnabled,
      language: settings.language,
      profileVisibility: settings.profileVisibility,
    });
  } catch (e) { next(e); }
});

// PATCH /api/student/settings
studentRouter.patch("/settings", async (req: AuthedRequest, res, next) => {
  try {
    const studentId = ensureStudent(req);

    const body = z.object({
      theme: z.enum(["SYSTEM", "LIGHT", "DARK"]).optional(),
      notifications: z.boolean().optional(),
      language: z.string().min(2).max(10).optional(),
      profileVisibility: z.enum(["CAMPUS_ONLY", "PUBLIC", "PRIVATE"]).optional(),
    }).parse(req.body);

    const updated = await prisma.studentSetting.upsert({
      where: { studentId },
      update: {
        theme: body.theme as any,
        notificationsEnabled: body.notifications,
        language: body.language,
        profileVisibility: body.profileVisibility as any,
      },
      create: {
        studentId,
        theme: (body.theme as any) ?? "SYSTEM",
        notificationsEnabled: body.notifications ?? true,
        language: body.language ?? "en",
        profileVisibility: (body.profileVisibility as any) ?? "CAMPUS_ONLY",
      }
    });

    res.json({
      theme: updated.theme,
      notifications: updated.notificationsEnabled,
      language: updated.language,
      profileVisibility: updated.profileVisibility,
    });
  } catch (e) { next(e); }
});

// GET /api/student/courses
studentRouter.get("/courses", async (req: AuthedRequest, res, next) => {
  try {
    const studentId = ensureStudent(req);

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        offering: {
          include: {
            course: true,
            faculty: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      studentId,
      items: enrollments.map(e => ({
        courseId: e.offering.course.id,
        code: e.offering.course.code,
        title: e.offering.course.title,
        credits: e.offering.course.credits,
        semester: e.offering.semester,
        faculty: { id: e.offering.faculty.id, name: e.offering.faculty.name }
      }))
    });
  } catch (e) { next(e); }
});

// GET /api/student/attendance (summary per course)
studentRouter.get("/attendance", async (req: AuthedRequest, res, next) => {
  try {
    const studentId = ensureStudent(req);

    // For each enrolled offering, compute present/total
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: { offering: { include: { course: true } } }
    });

    const items = [];
    for (const e of enrollments) {
      const offeringId = e.offeringId;

      const total = await prisma.attendanceSession.count({ where: { offeringId } });

      const present = await prisma.attendanceMark.count({
        where: {
          studentId,
          session: { offeringId },
          status: "PRESENT",
        }
      });

      const percent = total === 0 ? 0 : Math.round((present / total) * 100);

      const status = percent >= 75 ? "ELIGIBLE" : "WARNING";

      items.push({
        courseId: e.offering.course.id,
        code: e.offering.course.code,
        title: e.offering.course.title,
        present,
        total,
        percent,
        status
      });
    }

    res.json({ studentId, items });
  } catch (e) { next(e); }
});

// GET /api/student/library/issues
studentRouter.get("/library/issues", async (req: AuthedRequest, res, next) => {
  try {
    const studentId = ensureStudent(req);

    const issues = await prisma.libraryIssue.findMany({
      where: {
        studentId,
        status: "ISSUED",
        returnDate: null,
      },
      include: {
        copy: {
          include: { book: true }
        }
      },
      orderBy: { dueDate: "asc" }
    });

    res.json({
      studentId,
      items: issues.map(i => ({
        issueId: i.id,
        book: {
          id: i.copy.book.id,
          title: i.copy.book.title,
          author: i.copy.book.author
        },
        dueDate: i.dueDate.toISOString().slice(0, 10),
        status: i.status
      }))
    });
  } catch (e) { next(e); }
});

// GET /api/student/requests
studentRouter.get("/requests", async (req: AuthedRequest, res, next) => {
  try {
    const studentId = ensureStudent(req);

    const requests = await prisma.request.findMany({
      where: { studentId },
      orderBy: { submittedAt: "desc" }
    });

    res.json({
      studentId,
      items: requests.map(r => ({
        id: r.id,
        displayId: r.displayId,
        title: r.title,
        status: r.status,
        submittedAt: r.submittedAt.toISOString()
      }))
    });
  } catch (e) { next(e); }
});

// POST /api/student/requests
studentRouter.post("/requests", async (req: AuthedRequest, res, next) => {
  try {
    const studentId = ensureStudent(req);

    const body = z.object({
      title: z.string().min(2).max(120),
      description: z.string().max(2000).optional(),
    }).parse(req.body);

    const displayId = await nextRequestDisplayId();

    const created = await prisma.request.create({
      data: {
        displayId,
        studentId,
        title: body.title,
        description: body.description ?? null,
        status: "OPEN",
      }
    });

    res.status(201).json({
      id: created.id,
      displayId: created.displayId,
      status: created.status,
      submittedAt: created.submittedAt.toISOString()
    });
  } catch (e) { next(e); }
});

// GET /api/student/fees/summary (simple computed summary)
studentRouter.get("/fees/summary", async (req: AuthedRequest, res, next) => {
  try {
    const studentId = ensureStudent(req);

    const feeAccount = await prisma.feeAccount.findUnique({
      where: { studentId },
      include: { charges: true, payments: true }
    });
    if (!feeAccount) throw new HttpError(404, "Fee account not found");

    const totalPayable = feeAccount.charges.reduce((s, c) => s + c.amount, 0);
    const totalPaid = feeAccount.payments.reduce((s, p) => s + p.amount, 0);
    const due = Math.max(0, totalPayable - totalPaid);

    const status =
      due === 0 ? "PAID" :
      totalPaid === 0 ? "UNPAID" :
      "PARTIALLY_PAID";

    res.json({
      studentId,
      currency: feeAccount.currency,
      totalPayable,
      totalPaid,
      due,
      status
    });
  } catch (e) { next(e); }
});

// GET /api/student/home (aggregated)
studentRouter.get("/home", async (req: AuthedRequest, res, next) => {
  try {
    const studentId = ensureStudent(req);

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new HttpError(404, "Student not found");

    // Courses
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: { offering: { include: { course: true, faculty: true } } }
    });

    const courses = enrollments.map(e => ({
      id: e.offering.course.id,
      code: e.offering.course.code,
      title: e.offering.course.title,
      credits: e.offering.course.credits
    }));

    // Attendance summary (top/all)
    const attendance = [];
    for (const e of enrollments) {
      const offeringId = e.offeringId;
      const total = await prisma.attendanceSession.count({ where: { offeringId } });
      const present = await prisma.attendanceMark.count({
        where: { studentId, session: { offeringId }, status: "PRESENT" }
      });
      const percent = total === 0 ? 0 : Math.round((present / total) * 100);
      const status = percent >= 75 ? "ELIGIBLE" : "WARNING";
      attendance.push({ courseId: e.offering.course.id, code: e.offering.course.code, percent, status });
    }

    // Library (top 5)
    const issues = await prisma.libraryIssue.findMany({
      where: { studentId, status: "ISSUED", returnDate: null },
      include: { copy: { include: { book: true } } },
      orderBy: { dueDate: "asc" },
      take: 5
    });
    const library = issues.map(i => ({
      issueId: i.id,
      title: i.copy.book.title,
      dueDate: i.dueDate.toISOString().slice(0,10)
    }));

    // Requests (top 5)
    const reqs = await prisma.request.findMany({
      where: { studentId },
      orderBy: { submittedAt: "desc" },
      take: 5
    });
    const requests = reqs.map(r => ({
      id: r.displayId,
      type: r.title,
      status: r.status,
      createdAt: r.submittedAt.toISOString().slice(0,10)
    }));

    res.json({
      student: { id: student.id, name: student.fullName },
      courses,
      attendance,
      library,
      requests
    });

  } catch (e) { next(e); }
});