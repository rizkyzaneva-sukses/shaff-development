import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, hashToken, jsonError, requireUser } from "@/lib/auth";

export async function POST(request: Request) {
  try { assertSameOrigin(request); const actor = await requireUser(["ADMIN"]); const body = await request.json().catch(() => ({})); const userId = typeof body.userId === "string" ? body.userId : ""; const user = await prisma.user.findUnique({ where: { id: userId } }); if (!user) return Response.json({ error: "User tidak ditemukan" }, { status: 404 }); const rawToken = randomBytes(32).toString("base64url"); await prisma.$transaction([prisma.authToken.deleteMany({ where: { userId, type: "RESET", usedAt: null } }), prisma.authToken.create({ data: { tokenHash: hashToken(rawToken), userId, type: "RESET", expiresAt: new Date(Date.now() + 60 * 60_000) } }), prisma.auditLog.create({ data: { actorId: actor.id, action: "PASSWORD_RESET_LINK_CREATED", objectType: "User", objectId: userId } })]); return Response.json({ resetUrl: `/reset-password?token=${rawToken}` }); } catch (error) { return jsonError(error); }
}
