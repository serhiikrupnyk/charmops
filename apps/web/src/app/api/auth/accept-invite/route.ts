import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invitations, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sha256Hex } from "@/lib/tokens";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { token, firstName, lastName, password } = await req.json();

    if (!token || !firstName || !lastName || !password) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const tokenHash = sha256Hex(token);
    const now = new Date();

    const rows = await db.select().from(invitations).where(
      and(eq(invitations.tokenHash, tokenHash), eq(invitations.revoked, false))
    );
    const inv = rows[0];
    if (!inv) return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    if (inv.acceptedAt) return NextResponse.json({ error: "Invite already used" }, { status: 400 });
    if (inv.expiresAt < now) return NextResponse.json({ error: "Invite expired" }, { status: 400 });

    // створюємо користувача з роллю інвайту
    const hash = await bcrypt.hash(password, 10);
    await db.insert(users).values({
      email: inv.email,
      firstName,
      lastName,
      role: inv.role as "admin" | "operator", // super_admin не приймається з інвайтів
      passwordHash: hash,
    });

    // помічаємо інвайт використаним
    await db.update(invitations).set({ acceptedAt: now }).where(eq(invitations.id, inv.id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
