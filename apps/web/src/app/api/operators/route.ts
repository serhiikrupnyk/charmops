import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/db";
import { users, profiles, operatorStatsDaily, operatorPresence } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

function today() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = await getToken({ req: req as any, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = String((token as any).role);
  const userId = Number((token as any).sub);

  // Кого показуємо:
  // - super_admin/admin: всіх операторів
  // - operator: лише себе
  const operatorWhere =
    role === "operator"
      ? and(eq(users.role, "operator"), eq(users.id, userId))
      : eq(users.role, "operator");

  const operatorRows = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
    })
    .from(users)
    .where(operatorWhere);

  const ids = operatorRows.map((r) => r.id);
  if (ids.length === 0) return NextResponse.json({ ok: true, operators: [] });

  // К-сть анкет на оператора
  const profileCounts = await db
    .select({ assignedOperatorId: profiles.assignedOperatorId, cnt: sql<number>`count(*)` })
    .from(profiles)
    .where(inArray(profiles.assignedOperatorId, ids))
    .groupBy(profiles.assignedOperatorId);

  const countsMap = new Map<number, number>();
  for (const r of profileCounts) countsMap.set(r.assignedOperatorId!, Number(r.cnt));

  // Онлайн: з operator_presence.last_ping за 60с
  const presRows = await db
    .select({ userId: operatorPresence.userId, lastPing: operatorPresence.lastPing })
    .from(operatorPresence)
    .where(inArray(operatorPresence.userId, ids));

  const presMap = new Map<number, number>();
  for (const r of presRows) presMap.set(r.userId, new Date(r.lastPing).getTime());
  const nowTs = Date.now();

  // KPI за сьогодні
  const day = today();
  const statsRows = await db
    .select({
      userId: operatorStatsDaily.userId,
      replies: operatorStatsDaily.replies,
      avgReplySec: operatorStatsDaily.avgReplySec,
      replyRatePct: operatorStatsDaily.replyRatePct,
    })
    .from(operatorStatsDaily)
    .where(and(inArray(operatorStatsDaily.userId, ids), eq(operatorStatsDaily.date, day)));

  const statsMap = new Map<number, { replies: number; avgReplySec: number; replyRatePct: number }>();
  for (const s of statsRows) {
    statsMap.set(s.userId, {
      replies: s.replies ?? 0,
      avgReplySec: s.avgReplySec ?? 0,
      replyRatePct: s.replyRatePct ?? 0,
    });
  }

  const result = operatorRows.map((u) => {
    const lastTs = presMap.get(u.id) ?? 0;
    const online = lastTs >= nowTs - 60_000;
    const stats = statsMap.get(u.id) ?? { replies: 0, avgReplySec: 0, replyRatePct: 0 };

    return {
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.role,
      profilesCount: countsMap.get(u.id) ?? 0,
      online,
      stats,
    };
  });

  return NextResponse.json({ ok: true, operators: result });
}
