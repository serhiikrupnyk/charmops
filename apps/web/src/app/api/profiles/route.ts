import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/db";
import { profiles, users } from "@/db/schema";
import { and, eq, isNull, not, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = await getToken({ req: req as any, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((token as any).role);
  const uid = Number((token as any).sub);
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") || undefined; // sofiadate | sakuradate
  const status = searchParams.get("status") || undefined;     // active|paused|banned|archived
  const assigned = searchParams.get("assigned") || "all";     // unassigned|assigned|all

  let where = and();
  if (role === "operator") {
    where = and(where, eq(profiles.assignedOperatorId, uid));
  } else {
    if (platform) where = and(where, eq(profiles.platform, platform as any));
    if (status) where = and(where, eq(profiles.status, status as any));
    if (assigned === "assigned") where = and(where, not(isNull(profiles.assignedOperatorId)));
    if (assigned === "unassigned") where = and(where, isNull(profiles.assignedOperatorId));
  }

  const rows = await db
    .select({
      id: profiles.id,
      platform: profiles.platform,
      login: profiles.login,
      displayName: profiles.displayName,
      status: profiles.status,
      lastSyncedAt: profiles.lastSyncedAt,
      assignedOperatorId: profiles.assignedOperatorId,
      assignedOperatorFirst: users.firstName,
      assignedOperatorLast: users.lastName,
    })
    .from(profiles)
    .leftJoin(users, eq(users.id, profiles.assignedOperatorId))
    .where(where)
    .orderBy(sql`${profiles.createdAt} DESC`)
    .limit(200);

  return NextResponse.json({
    ok: true,
    profiles: rows.map(r => ({
      id: r.id,
      platform: r.platform,
      login: r.login,
      displayName: r.displayName,
      status: r.status,
      lastSyncedAt: r.lastSyncedAt,
      assignedOperatorId: r.assignedOperatorId,
      assignedOperatorName: r.assignedOperatorId ? `${r.assignedOperatorFirst} ${r.assignedOperatorLast}` : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req: req as any, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((token as any).role);
  const creatorId = Number((token as any).sub);
  if (!["super_admin", "admin"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { platform, login, password, displayName, locale, avatarUrl, status } = body as Record<string, string>;

  if (!platform || !["sofiadate", "sakuradate"].includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }
  if (!login || !password || !displayName) {
    return NextResponse.json({ error: "platform, login, password, displayName are required" }, { status: 400 });
  }

  // encrypt password
  const { encryptPassword } = await import("@/lib/crypto");
  const passwordEnc = encryptPassword(password);

  const [row] = await db.insert(profiles).values({
    platform,
    login,
    passwordEnc,
    displayName,
    locale: locale || "en",
    avatarUrl: avatarUrl || null as any,
    status: (status || "active") as any,
    createdByUserId: creatorId,
  }).returning();

  return NextResponse.json({
    ok: true,
    profile: {
      id: row.id,
      platform: row.platform,
      login: row.login,
      displayName: row.displayName,
      status: row.status,
      lastSyncedAt: row.lastSyncedAt,
      assignedOperatorId: null,
      assignedOperatorName: null,
    },
  });
}
