import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma";
import { UserRole } from "@prisma/client";

type AnyPrisma = typeof prisma & Record<string, any>;

function pickInstitutionRole(): string {
  const values = Object.values(UserRole) as string[];

  // Preferred exact matches (if your enum has them)
  const preferred = [
    "INSTITUTION",
    "INSTITUTION_ADMIN",
    "INSTITUTE",
    "COLLEGE",
    "SCHOOL",
    "ADMIN", // fallback-ish
  ];

  for (const p of preferred) {
    if (values.includes(p)) return p;
  }

  // Fuzzy match: anything containing "INSTIT"
  const fuzzy = values.find((v) => v.toUpperCase().includes("INSTIT"));
  if (fuzzy) return fuzzy;

  // Absolute fallback: first enum value
  return values[0] || "ADMIN";
}

async function tryUpsertUser(
  P: AnyPrisma,
  email: string,
  updateData: any,
  createData: any
) {
  return await P.user.upsert({
    where: { email },
    update: updateData,
    create: createData,
  });
}

async function main() {
  const P = prisma as AnyPrisma;

  const EMAIL = (process.env.INSTITUTION_EMAIL || "institution@gcu.edu.in")
    .toLowerCase()
    .trim();

  const PASSWORD = process.env.INSTITUTION_PASSWORD || "ChangeMe@123";
  const DISPLAY_NAME = process.env.INSTITUTION_USER_NAME || "Institution Admin";

  const ROLE = pickInstitutionRole();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // We will NOT assume these fields exist; we’ll attempt progressively.
  const baseUpdate: any = { role: ROLE, passwordHash };
  const baseCreate: any = { email: EMAIL, role: ROLE, passwordHash };

  // Attempt 1: with name + institutionId (if they exist)
  const attempt1Update = { ...baseUpdate, name: DISPLAY_NAME, institutionId: undefined };
  const attempt1Create = { ...baseCreate, name: DISPLAY_NAME, institutionId: undefined };

  // Attempt 2: with name only
  const attempt2Update = { ...baseUpdate, name: DISPLAY_NAME };
  const attempt2Create = { ...baseCreate, name: DISPLAY_NAME };

  // Attempt 3: base only (no name, no institutionId)
  const attempt3Update = { ...baseUpdate };
  const attempt3Create = { ...baseCreate };

  let user: any = null;
  let lastErr: any = null;

  // Try in order; if your schema doesn’t have a field, Prisma throws "Unknown arg"
  for (const [i, upd, cre] of [
    [1, attempt1Update, attempt1Create],
    [2, attempt2Update, attempt2Create],
    [3, attempt3Update, attempt3Create],
  ] as any[]) {
    try {
      user = await tryUpsertUser(P, EMAIL, upd, cre);
      console.log(`✅ Created/Updated institution user (attempt ${i})`);
      break;
    } catch (e: any) {
      lastErr = e;
    }
  }

  if (!user) {
    console.error("❌ Failed to create institution user.");
    console.error(lastErr);
    process.exit(1);
  }

  console.log("User (raw):");
  console.log(user);

  console.log("\nLOGIN DETAILS (keep local, change later):");
  console.log("Email:", EMAIL);
  console.log("Password:", PASSWORD);
  console.log("Role used:", ROLE);
}

main()
  .catch((e) => {
    console.error("❌ Script error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
