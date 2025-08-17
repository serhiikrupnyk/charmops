import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req: req as any, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((token as any).role);
  if (!["super_admin", "admin"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const operatorId = Number(params.id);
  const { profileId } = await req.json().catch(() => ({}));
  if (!Number.isFinite(operatorId) || !Number.isFinite(profileId)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // підтвердити, що профіль справді належить цьому оператору
  const [updated] = await db
    .update(profiles)
    .set({ assignedOperatorId: null as any })
    .where(and(eq(profiles.id, profileId), eq(profiles.assignedOperatorId, operatorId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Profile not found or not assigned to operator" }, { status: 404 });
  return NextResponse.json({ ok: true, profile: updated });
}
