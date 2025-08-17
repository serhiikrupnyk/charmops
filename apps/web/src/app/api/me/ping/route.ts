import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/db";
import { operatorPresence, operatorActivity } from "@/db/schema"; // activity залишимо, якщо хочеш історію
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const token = await getToken({ req: req as any, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = Number((token as any).sub);
  const now = new Date();

  // 1) Легкий оновлювач (1 рядок на користувача)
  await db
    .insert(operatorPresence)
    .values({ userId, lastPing: now })
    .onConflictDoUpdate({
      target: operatorPresence.userId,
      set: { lastPing: now },
    });

  // 2) (опційно) зберігати повний лог раз на N хвилин або вимкнути
  await db.insert(operatorActivity).values({ userId, pingAt: now });

  return NextResponse.json({ ok: true });
}
