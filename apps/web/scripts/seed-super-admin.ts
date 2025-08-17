import { config } from "dotenv";
import { join } from "node:path";
import fs from "node:fs";

// Завантажити .env.local (або .env) ДО імпорту БД
const envPath = [join(process.cwd(), ".env.local"), join(process.cwd(), ".env")].find(fs.existsSync);
config({ path: envPath ?? ".env.local" });

async function main() {
  console.log("DATABASE_URL =", process.env.DATABASE_URL); // разово для контролю

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set (apps/web/.env.local)");
  }

  const bcrypt = (await import("bcryptjs")).default;
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../src/db");
  const { users } = await import("../src/db/schema");

  const email = (process.env.SUPER_ADMIN_EMAIL ?? "").trim();
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "";
  const firstName = (process.env.SUPER_ADMIN_FIRST_NAME ?? "").trim();
  const lastName = (process.env.SUPER_ADMIN_LAST_NAME ?? "").trim();

  if (!email || !password || !firstName || !lastName) {
    throw new Error("Set SUPER_ADMIN_* vars in .env.local");
  }

  const exists = await db.select().from(users).where(eq(users.email, email));
  if (exists.length) {
    const u = exists[0];
    if (u.role === "super_admin") {
      console.log(`✓ Super admin already exists: ${email}`);
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    await db.update(users).set({ role: "super_admin", passwordHash: hash }).where(eq(users.id, u.id));
    console.log(`✓ Updated existing user to super_admin: ${email}`);
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    email,
    firstName,
    lastName,
    role: "super_admin",
    passwordHash: hash,
  });
  console.log(`✓ Created super_admin: ${email}`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
