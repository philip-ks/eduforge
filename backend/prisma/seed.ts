import { prisma } from "../src/lib/prisma";

// Helper: ensure a Department exists
async function ensureDepartment(name: string) {
  const existing = await prisma.department.findFirst({ where: { name } as any });
  if (existing) return existing;
  return prisma.department.create({ data: { name } as any });
}

// Helper: ensure a Designation exists (requires department)
async function ensureDesignation(title: string, departmentId: string) {
  const existing = await prisma.designation.findFirst({
    where: { title, departmentId },
  });
  if (existing) return existing;

  return prisma.designation.create({
    data: {
      title,
      department: { connect: { id: departmentId } },
    },
  });
}

// Helper: ensure a Subject exists (requires department)
async function ensureSubject(name: string, departmentId: string) {
  const existing = await prisma.subject.findFirst({
    where: { name, departmentId } as any,
  });
  if (existing) return existing;

  return prisma.subject.create({
    data: {
      name,
      department: { connect: { id: departmentId } },
    } as any,
  });
}

async function main() {
  // Departments to seed
  const departments = ["Administration", "Computer Science", "Commerce", "English", "Mathematics", "Physics"];

  // Ensure departments and keep a map
  const deptMap = new Map<string, any>();
  for (const d of departments) {
    const dept = await ensureDepartment(d);
    deptMap.set(d.toLowerCase(), dept);
  }

  // Default department fallback
  const adminDept = deptMap.get("administration");
  if (!adminDept?.id) {
    throw new Error("Failed to ensure Administration department (missing id). Check Department model primary key.");
  }

  // Designations attached to Administration (required relation)
  const designations = ["Principal", "Vice Principal", "HOD", "Assistant Professor", "Lecturer", "Librarian"];
  for (const t of designations) {
    await ensureDesignation(t, adminDept.id);
  }

  // Subjects - attach to best matching department, else Administration
  const subjects = ["Mathematics", "Physics", "Chemistry", "English", "Computer Science", "Accounting"];

  function chooseDeptIdForSubject(subject: string): string {
    const s = subject.toLowerCase();
    if (s.includes("math")) return (deptMap.get("mathematics")?.id ?? adminDept.id);
    if (s.includes("physics")) return (deptMap.get("physics")?.id ?? adminDept.id);
    if (s.includes("english")) return (deptMap.get("english")?.id ?? adminDept.id);
    if (s.includes("computer")) return (deptMap.get("computer science")?.id ?? adminDept.id);
    if (s.includes("account")) return (deptMap.get("commerce")?.id ?? adminDept.id);
    // chemistry not in departments list -> default admin
    return adminDept.id;
  }

  for (const s of subjects) {
    const deptId = chooseDeptIdForSubject(s);
    await ensureSubject(s, deptId);
  }

  console.log("✅ Seed complete: departments/designations/subjects ensured");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
