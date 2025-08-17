import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = await getToken({ req: req as any, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = String((token as any).role);
  if (!["super_admin", "admin"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const onlyUnassigned = searchParams.get("assigned") === "unassigned";
  const status = searchParams.get("status") ?? undefined;
  const platform = searchParams.get("platform") ?? undefined;

  let where = and();
  if (onlyUnassigned) where = and(where, isNull(profiles.assignedOperatorId));
  if (status) where = and(where, eq(profiles.status, status as any));
  if (platform) where = and(where, eq(profiles.platform, platform as any));

  const rows = await db
    .select({
      id: profiles.id,
      platform: profiles.platform,
      login: profiles.login,
      displayName: profiles.displayName,
      status: profiles.status,
      lastSyncedAt: profiles.lastSyncedAt,
    })
    .from(profiles)
    .where(where)
    .limit(100);

  return NextResponse.json({ ok: true, profiles: rows });
}
