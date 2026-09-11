import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";

export async function GET() {
  try { const user = await requireUser(); const where = user.role === "ADMIN" || user.role === "FINANCE" ? {} : user.role === "LEAD" ? { client: { leadId: user.id } } : { members: { some: { userId: user.id, isActive: true } } }; const programs = await prisma.program.findMany({ where, include: { client: true, members: { include: { user: { select: { id: true, name: true, role: true } } } }, tasks: { select: { status: true } } }, orderBy: { targetDate: "asc" } }); return Response.json({ programs }); } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const user = await requireUser(["ADMIN", "LEAD"]); const body = await request.json().catch(() => ({})); const clientId = typeof body.clientId === "string" ? body.clientId : ""; const name = typeof body.name === "string" ? body.name.trim() : ""; const objective = typeof body.objective === "string" ? body.objective.trim() : ""; const startDate = new Date(body.startDate); const targetDate = new Date(body.targetDate);
    if (!clientId || !name || !objective || Number.isNaN(startDate.getTime()) || Number.isNaN(targetDate.getTime()) || targetDate < startDate) return Response.json({ error: "Client, nama, tujuan, dan tanggal program harus valid" }, { status: 400 });
    const client = await prisma.client.findFirst({ where: { id: clientId, ...(user.role === "LEAD" ? { leadId: user.id } : {}) } }); if (!client || client.status !== "ACTIVE") return Response.json({ error: "Client tidak ditemukan atau belum aktif" }, { status: 404 });
    const serviceType = ["BUSINESS_MENTORING", "SYSTEM_DIGITALIZATION", "COMBINED"].includes(body.serviceType) ? body.serviceType : "COMBINED";
    const memberIds = Array.isArray(body.memberIds) ? body.memberIds.filter((item: unknown): item is string => typeof item === "string").slice(0, 30) : []; if (!memberIds.includes(user.id)) memberIds.unshift(user.id);
    const members = await prisma.user.findMany({ where: { id: { in: memberIds }, status: "ACTIVE" }, select: { id: true } }); if (members.length !== new Set(memberIds).size) return Response.json({ error: "Ada anggota program yang tidak valid" }, { status: 400 });
    const program = await prisma.$transaction(async (tx) => { const created = await tx.program.create({ data: { clientId, name: name.slice(0, 160), serviceType, objective: objective.slice(0, 3000), deliverables: typeof body.deliverables === "string" ? body.deliverables.trim().slice(0, 3000) : null, startDate, targetDate, status: "PLANNED", members: { create: memberIds.map((userId: string) => ({ userId })) } }, include: { client: true, members: true } }); await tx.auditLog.create({ data: { actorId: user.id, action: "PROGRAM_CREATED", objectType: "Program", objectId: created.id, changes: { clientId, name, serviceType } } }); return created; }); return Response.json({ program }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
