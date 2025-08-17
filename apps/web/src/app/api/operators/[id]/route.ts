import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/db";
import { users, profiles, operatorActivity, operatorStatsDaily, operatorPresence } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

function todayStr() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req: req as any, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actorRole = String((token as any).role);
  const actorId = Number((token as any).sub);
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  if (actorRole === "operator" && actorId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 1) базова інформація про оператора
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
    })
    .from(users)
    .where(and(eq(users.id, id), eq(users.role, "operator")));
  const u = rows[0];
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 2) призначені профілі
  const profs = await db
    .select({
      id: profiles.id,
      platform: profiles.platform,
      login: profiles.login,
      displayName: profiles.displayName,
      status: profiles.status,
      lastSyncedAt: profiles.lastSyncedAt,
    })
    .from(profiles)
    .where(eq(profiles.assignedOperatorId, id));

  // 3) онлайн-статус — спершу з operator_presence, fallback на max(activity)
  let lastPingTs = 0;

  const presence = await db
    .select({ lastPing: operatorPresence.lastPing })
    .from(operatorPresence)
    .where(eq(operatorPresence.userId, id));
  if (presence[0]?.lastPing) {
    lastPingTs = new Date(presence[0].lastPing as unknown as string).getTime();
  } else {
    const lastPingRow = await db
      .select({ lastPing: sql<string | null>`max(${operatorActivity.pingAt})` })
      .from(operatorActivity)
      .where(eq(operatorActivity.userId, id));
    if (lastPingRow[0]?.lastPing) {
      lastPingTs = new Date(lastPingRow[0].lastPing as string).getTime();
    }
  }
  const online = lastPingTs >= Date.now() - 60_000;
  const lastPing = lastPingTs ? new Date(lastPingTs).toISOString() : null;

  // 4) метрики за сьогодні
  const t = todayStr();
  const todayRow = await db
    .select({
      replies: operatorStatsDaily.replies,
      avgReplySec: operatorStatsDaily.avgReplySec,
      replyRatePct: operatorStatsDaily.replyRatePct,
    })
    .from(operatorStatsDaily)
    .where(and(eq(operatorStatsDaily.userId, id), eq(operatorStatsDaily.date, t)));
  const stats = todayRow[0] ?? { replies: 0, avgReplySec: 0, replyRatePct: 0 };

  // 5) останні 20 пінгів для вкладки Activity (як ISO-рядки)
  const act = await db
    .select({ pingAt: operatorActivity.pingAt })
    .from(operatorActivity)
    .where(eq(operatorActivity.userId, id))
    .orderBy(sql`${operatorActivity.pingAt} DESC`)
    .limit(20);

  return NextResponse.json({
    ok: true,
    operator: {
      id: u.id,
      email: u.email,
      name: `${u.firstName} ${u.lastName}`,
      role: u.role,
      online,
      lastPing, // ISO або null
      stats,
      profiles: profs,
      activity: act.map((a) => (a.pingAt ? new Date(a.pingAt as unknown as string).toISOString() : "")),
    },
  });
}
