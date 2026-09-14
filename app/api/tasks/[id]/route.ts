import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";
import { taskDetailInclude } from "@/lib/task-query";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser(["ADMIN", "LEAD", "MEMBER"]);
    const task = await prisma.task.findFirst({
      where: { id, ...(user.role === "ADMIN" || user.role === "FINANCE" ? {} : user.role === "LEAD" ? { program: { client: { leadId: user.id } } } : { assigneeId: user.id }) },
      include: taskDetailInclude
    });
    if (!task) return Response.json({ error: "Task tidak ditemukan" }, { status: 404 });
    return Response.json({ task });
  } catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; assertSameOrigin(request); const user = await requireUser(["ADMIN", "LEAD", "MEMBER"]); const existing = await prisma.task.findFirst({ where: { id, ...(user.role === "ADMIN" ? {} : user.role === "LEAD" ? { program: { client: { leadId: user.id } } } : { assigneeId: user.id }), }, include: { checklist: true, program: true } }); if (!existing) return Response.json({ error: "Task tidak ditemukan" }, { status: 404 }); if (["COMPLETED", "CANCELLED"].includes(existing.program.status)) return Response.json({ error: "Program sudah terminal" }, { status: 409 }); const body = await request.json().catch(() => ({})); const version = Number(body.version); if (!Number.isInteger(version) || version !== existing.version) return Response.json({ error: "Task sudah berubah. Muat ulang sebelum menyimpan." }, { status: 409 }); const data: Record<string, unknown> = {};
    if (typeof body.status === "string" && ["TODO", "IN_PROGRESS", "BLOCKED", "DONE", "CANCELLED"].includes(body.status)) data.status = body.status;
    if (typeof body.priority === "string" && ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(body.priority)) data.priority = body.priority;
    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim().slice(0, 240);
    if (typeof body.description === "string") data.description = body.description.trim().slice(0, 5000);
    if (typeof body.blockedReason === "string") data.blockedReason = body.blockedReason.trim().slice(0, 1000);
    if (typeof body.completionNote === "string") data.completionNote = body.completionNote.trim().slice(0, 2000);
    if (data.status === "BLOCKED" && !data.blockedReason && !existing.blockedReason) return Response.json({ error: "Alasan blocked wajib diisi" }, { status: 400 });
    if (data.status === "DONE" && !data.completionNote && !existing.completionNote) return Response.json({ error: "Ringkasan hasil wajib diisi" }, { status: 400 });
    const updated = await prisma.$transaction(async (tx) => { const result = await tx.task.updateMany({ where: { id, version }, data: { ...data, version: { increment: 1 }, completedAt: data.status === "DONE" ? new Date() : data.status ? null : undefined } }); if (result.count !== 1) throw new Error("TASK_CONFLICT"); const task = await tx.task.findUniqueOrThrow({ where: { id }, include: taskDetailInclude }); await tx.auditLog.create({ data: { actorId: user.id, action: "TASK_UPDATED", objectType: "Task", objectId: id, changes: JSON.parse(JSON.stringify(data)) } }); return task; }); return Response.json({ task: updated });
  } catch (error) { if (error instanceof Error && error.message === "TASK_CONFLICT") return Response.json({ error: "Task sudah berubah. Muat ulang sebelum menyimpan." }, { status: 409 }); return jsonError(error); }
}
