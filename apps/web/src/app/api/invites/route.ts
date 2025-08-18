import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getToken } from "next-auth/jwt";
import { db } from "@/db";
import { invites, users } from "@/db/schema";
import crypto from "crypto";
import { eq, and, isNull, sql } from "drizzle-orm";
import { sendInviteEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

const CreateInvite = z.object({
  email: z.string().email(),
  role: z.enum(["admin","operator"]),
});

function addDays(d: Date, days: number) { const x = new Date(d); x.setDate(x.getDate()+days); return x; }

export async function GET(req: NextRequest) {
  const token = await getToken({ req: req as any, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((token as any).role);
  if (!["super_admin","admin"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db.select().from(invites).orderBy(sql`${invites.createdAt} DESC`).limit(200);
  return NextResponse.json({ ok: true, invites: rows });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req: req as any, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actorRole = String((token as any).role);
  const creatorId = Number((token as any).sub);
  if (!["super_admin","admin"].includes(actorRole)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parse = CreateInvite.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: "Invalid body", details: parse.error.flatten() }, { status: 400 });

  const { email, role } = parse.data;
  if (actorRole === "admin" && role !== "operator") {
    return NextResponse.json({ error: "Admins can invite operators only" }, { status: 403 });
  }

  // Перевірка: користувач уже існує?
  const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existingUser.length) return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });

  // Можна перевикористати активний інвайт або створити новий:
  const activeInvite = await db.select().from(invites)
    .where(and(eq(invites.email, email), isNull(invites.usedAt)))
    .orderBy(sql`${invites.createdAt} DESC`)
    .limit(1);

  const tokenStr = crypto.randomBytes(32).toString("base64url");
  const days = Number(process.env.INVITE_EXPIRES_DAYS || 7);
  const expiresAt = addDays(new Date(), days);

  const row = activeInvite[0]
    ? (await db.update(invites).set({ token: tokenStr, role, expiresAt }).where(eq(invites.id, activeInvite[0].id)).returning())[0]
    : (await db.insert(invites).values({ email, role, token: tokenStr, expiresAt, createdByUserId: creatorId }).returning())[0];

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const link = `${appUrl}/invite/${row.token}`;

  // Надсилаємо емейл
  await sendInviteEmail(email, link);

  return NextResponse.json({ ok: true, invite: row });
}
