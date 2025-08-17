import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/db";
import { invitations } from "@/db/schema";
import { generateInviteToken, sha256Hex } from "@/lib/tokens";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// CREATE invite
export async function POST(req: NextRequest) {
  const token = await getToken({ req: req as any, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actorRole = String((token as any).role);
  const actorId = Number((token as any).sub);
  if (!["super_admin", "admin"].includes(actorRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, role } = await req.json().catch(() => ({} as any));
  if (!email || !role) {
    return NextResponse.json({ error: "email and role are required" }, { status: 400 });
  }
  if (!["admin", "operator"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (actorRole === "admin" && role !== "operator") {
    return NextResponse.json({ error: "Admins can invite operators only" }, { status: 403 });
  }

  const rawToken = generateInviteToken(32);
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 днів

  const [inv] = await db.insert(invitations).values({
    email,
    role,
    tokenHash,
    expiresAt,
    invitedByUserId: actorId,
  }).returning();

  const link = `${req.nextUrl.origin}/invite/${rawToken}`;
  return NextResponse.json({ ok: true, invitation: { ...inv, link } });
}

// LIST invites
export async function GET(req: NextRequest) {
  const token = await getToken({ req: req as any, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actorRole = String((token as any).role);
  const actorId = Number((token as any).sub);

  let rows;
  if (actorRole === "super_admin") {
    rows = await db.select().from(invitations);
  } else if (actorRole === "admin") {
    rows = await db.select().from(invitations).where(eq(invitations.invitedByUserId, actorId));
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Обчислимо status на льоту
  const now = Date.now();
  const normalized = rows.map((r) => {
    const expired = r.expiresAt ? r.expiresAt.getTime() < now : false;
    const status = r.revoked ? "revoked" : (r.acceptedAt ? "accepted" : (expired ? "expired" : "active"));
    return { ...r, status };
  });

  return NextResponse.json({ ok: true, invitations: normalized });
}
