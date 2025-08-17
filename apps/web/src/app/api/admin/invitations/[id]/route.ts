import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/db";
import { invitations } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req: req as any, secret: process.env.AUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actorRole = String((token as any).role);
  const actorId = Number((token as any).sub);
  if (!["super_admin", "admin"].includes(actorRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // супер-адмін може відкликати будь-який, адмін — лише свій і лише якщо не accepted
  const rows = await db.select().from(invitations).where(eq(invitations.id, id));
  const inv = rows[0];
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (actorRole === "admin" && inv.invitedByUserId !== actorId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (inv.acceptedAt) {
    return NextResponse.json({ error: "Invite already accepted" }, { status: 400 });
  }

  const [updated] = await db
    .update(invitations)
    .set({ revoked: true })
    .where(eq(invitations.id, id))
    .returning();

  return NextResponse.json({ ok: true, invitation: updated });
}
