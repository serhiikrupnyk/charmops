import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { invites, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const AcceptSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params; // ⬅️ розгортаємо Promise
  const body = await req.json().catch(() => null);
  const parse = AcceptSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: "Invalid body", details: parse.error.flatten() }, { status: 400 });

  const rows = await db.select().from(invites).where(eq(invites.token, token));
  const inv = rows[0];
  if (!inv) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  if (inv.usedAt) return NextResponse.json({ error: "Already used" }, { status: 400 });
  if (inv.expiresAt && new Date(inv.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "Expired" }, { status: 400 });
  }

  const existing = await db.select().from(users).where(eq(users.email, inv.email));
  if (existing.length) return NextResponse.json({ error: "User already exists" }, { status: 409 });

  const hash = await bcrypt.hash(parse.data.password, 10);
  const [created] = await db.insert(users).values({
    email: inv.email,
    firstName: parse.data.firstName,
    lastName: parse.data.lastName,
    role: inv.role as any,
    passwordHash: hash,
  }).returning();

  await db.update(invites).set({ usedAt: new Date() }).where(eq(invites.id, inv.id));
  return NextResponse.json({ ok: true, userId: created.id });
}
