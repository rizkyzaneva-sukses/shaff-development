import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";

const roles = ["ADMIN", "LEAD", "CMO", "COO", "FINANCE"] as const;
const statuses = ["ACTIVE", "INACTIVE"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(["ADMIN"]);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, jobTitle: true, email: true, role: true, status: true } });
    if (!existing) return Response.json({ error: "Anggota tidak ditemukan" }, { status: 404 });
    const role = body.role === undefined ? existing.role : body.role;
    const status = body.status === undefined ? existing.status : body.status;
    const name = body.name === undefined ? existing.name : typeof body.name === "string" ? body.name.trim().slice(0, 160) : "";
    const jobTitle = body.jobTitle === undefined ? existing.jobTitle : typeof body.jobTitle === "string" ? body.jobTitle.trim().slice(0, 120) || null : null;
    if (!roles.includes(role)) return Response.json({ error: "Peran tidak valid" }, { status: 400 });
    if (!statuses.includes(status)) return Response.json({ error: "Status tidak valid" }, { status: 400 });
    if (!name) return Response.json({ error: "Nama wajib diisi" }, { status: 400 });
    if (id === actor.id && (status !== "ACTIVE" || role !== actor.role)) return Response.json({ error: "Akun sendiri tidak dapat dinonaktifkan atau diubah perannya" }, { status: 400 });
    const updated = await prisma.$transaction(async (tx) => {
      if (existing.role === "ADMIN" && existing.status === "ACTIVE" && (role !== "ADMIN" || status !== "ACTIVE")) {
        const activeAdmins = await tx.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
        if (activeAdmins <= 1) throw new Error("LAST_ADMIN");
      }
      const user = await tx.user.update({ where: { id }, data: { name, jobTitle, role, status }, select: { id: true, name: true, jobTitle: true, email: true, role: true, status: true, lastLoginAt: true, createdAt: true } });
      if (status !== "ACTIVE") await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "USER_UPDATED", objectType: "User", objectId: id, changes: { before: existing, after: { name, jobTitle, role, status } } } });
      return user;
    });
    return Response.json({ user: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_ADMIN") return Response.json({ error: "Minimal harus ada satu admin aktif" }, { status: 409 });
    return jsonError(error);
  }
}
