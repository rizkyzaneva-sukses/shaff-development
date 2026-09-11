import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, createSession, getCurrentUser, jsonError, revokeCurrentSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const user = await getCurrentUser(); if (!user) return Response.json({ error: "Autentikasi diperlukan" }, { status: 401 }); const body = await request.json().catch(() => ({})); const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : ""; const newPassword = typeof body.newPassword === "string" ? body.newPassword : ""; if (newPassword.length < 12 || newPassword.length > 200) return Response.json({ error: "Password baru minimal 12 karakter" }, { status: 400 }); if (!(await bcrypt.compare(currentPassword, user.passwordHash))) return Response.json({ error: "Password saat ini salah" }, { status: 401 }); const passwordHash = await bcrypt.hash(newPassword, 12); await prisma.$transaction([prisma.user.update({ where: { id: user.id }, data: { passwordHash } }), prisma.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }), prisma.auditLog.create({ data: { actorId: user.id, action: "PASSWORD_CHANGED", objectType: "User", objectId: user.id } })]); await revokeCurrentSession(); await createSession(user.id); return Response.json({ ok: true });
  } catch (error) { return jsonError(error); }
}
