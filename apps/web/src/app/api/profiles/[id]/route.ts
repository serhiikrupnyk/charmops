import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req: req as any, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = String((token as any).role);
  const uid = Number((token as any).sub);

  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, any> = {};
  const editableGeneral = ["displayName", "locale", "avatarUrl", "status"] as const;

  for (const k of editableGeneral) {
    if (k in body) updates[k] = body[k];
  }

  // призначення/зняття оператора — тільки admin/super_admin
  if ("assignedOperatorId" in body) {
    if (!["super_admin", "admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    updates.assignedOperatorId = body.assignedOperatorId ?? null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // якщо оператор — можемо обмежити, щоб редагував лише свої (за потреби)
  if (role === "operator") {
    // оновлювати дозволимо тільки свої призначені
    const [own] = await db.select({ id: profiles.id }).from(profiles)
      .where(and(eq(profiles.id, id), eq(profiles.assignedOperatorId, uid)));
    if (!own) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [row] = await db.update(profiles).set(updates).where(eq(profiles.id, id)).returning();

  return NextResponse.json({
    ok: true,
    profile: {
      id: row.id,
      platform: row.platform,
      login: row.login,
      displayName: row.displayName,
      status: row.status,
      lastSyncedAt: row.lastSyncedAt,
      assignedOperatorId: row.assignedOperatorId,
    },
  });
}
