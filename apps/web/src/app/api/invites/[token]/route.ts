import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invites } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params; // ⬅️ розгортаємо Promise
  const rows = await db.select().from(invites).where(eq(invites.token, token));
  const inv = rows[0];
  if (!inv) return NextResponse.json({ error: "Invalid invite", code: "invalid" }, { status: 404 });
  if (inv.usedAt) return NextResponse.json({ error: "Already used", code: "used" }, { status: 400 });
  if (inv.expiresAt && new Date(inv.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "Expired", code: "expired" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, email: inv.email, role: inv.role });
}
