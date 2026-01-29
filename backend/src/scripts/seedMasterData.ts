import { prisma } from "../utils/prisma";

async function main() {
  // Create Departments
  const depTeachers = await prisma.department.upsert({
    where: { name: "Teachers" },
    update: { isActive: true },
    create: { name: "Teachers", code: "TEACH" },
  });

  const depResource = await prisma.department.upsert({
    where: { name: "Resource Management" },
    update: { isActive: true },
    create: { name: "Resource Management", code: "RM" },
  });

  // Create Designations (Teachers)
  await prisma.designation.upsert({
    where: { departmentId_title: { departmentId: depTeachers.id, title: "Assistant Professor" } },
    update: { isActive: true },
    create: { departmentId: depTeachers.id, title: "Assistant Professor", level: 1 },
  });

  await prisma.designation.upsert({
    where: { departmentId_title: { departmentId: depTeachers.id, title: "Associate Professor" } },
    update: { isActive: true },
    create: { departmentId: depTeachers.id, title: "Associate Professor", level: 2 },
  });

  // Create Designations (Resource)
  await prisma.designation.upsert({
    where: { departmentId_title: { departmentId: depResource.id, title: "Chief" } },
    update: { isActive: true },
    create: { departmentId: depResource.id, title: "Chief", level: 3 },
  });

  await prisma.designation.upsert({
    where: { departmentId_title: { departmentId: depResource.id, title: "Administrative Officer" } },
    update: { isActive: true },
    create: { departmentId: depResource.id, title: "Administrative Officer", level: 2 },
  });

  // Create Subjects (Teachers dept)
  await prisma.subject.upsert({
    where: { departmentId_name: { departmentId: depTeachers.id, name: "Mathematics" } },
    update: { isActive: true },
    create: { departmentId: depTeachers.id, name: "Mathematics", code: "MATH" },
  });

  await prisma.subject.upsert({
    where: { departmentId_name: { departmentId: depTeachers.id, name: "Physics" } },
    update: { isActive: true },
    create: { departmentId: depTeachers.id, name: "Physics", code: "PHY" },
  });

  console.log("✅ Seeded master data:", {
    departments: [depTeachers.name, depResource.name],
  });
}

main()
  .catch((e) => {
    console.error("❌ seedMasterData failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
