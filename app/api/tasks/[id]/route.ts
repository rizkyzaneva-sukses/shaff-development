import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";
import { taskDetailInclude } from "@/lib/task-query";
import { TASK_REOPEN_REASON_MAX, isAllowedTaskTransition, isTaskStatus, requiresReopenReason, type TaskStatusValue } from "@/lib/task-status";
import { isExecutor } from "@/lib/roles";

// Validasi transisi status (PRD bagian 9) dijalankan satu kali sebelum menulis, dipakai juga oleh audit log.
function validateTaskStatusChange(from: TaskStatusValue, to: TaskStatusValue, reopenReason: string) {
  if (!isAllowedTaskTransition(from, to)) return { ok: false as const, error: `Status tidak dapat diubah dari ${from} ke ${to}` };
  if (requiresReopenReason(from, to) && !reopenReason) return { ok: false as const, error: "Alasan membuka kembali task wajib diisi" };
  return { ok: true as const };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser(["ADMIN", "LEAD", "CMO", "COO"]);
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
    const { id } = await params; assertSameOrigin(request); const user = await requireUser(["ADMIN", "LEAD", "CMO", "COO"]); const existing = await prisma.task.findFirst({ where: { id, ...(user.role === "ADMIN" ? {} : user.role === "LEAD" ? { program: { client: { leadId: user.id } } } : { assigneeId: user.id }), }, include: { checklist: true, program: true } }); if (!existing) return Response.json({ error: "Task tidak ditemukan" }, { status: 404 }); if (["COMPLETED", "CANCELLED"].includes(existing.program.status)) return Response.json({ error: "Program sudah terminal" }, { status: 409 }); const body = await request.json().catch(() => ({})); const version = Number(body.version); if (!Number.isInteger(version) || version !== existing.version) return Response.json({ error: "Task sudah berubah. Muat ulang sebelum menyimpan." }, { status: 409 }); const data: Record<string, unknown> = {};
    if (typeof body.status === "string" && isTaskStatus(body.status)) data.status = body.status;
    if (typeof body.priority === "string" && ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(body.priority)) data.priority = body.priority;
    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim().slice(0, 240);
    if (typeof body.description === "string") data.description = body.description.trim().slice(0, 5000);
    if (typeof body.blockedReason === "string") data.blockedReason = body.blockedReason.trim().slice(0, 1000);
    if (typeof body.completionNote === "string") data.completionNote = body.completionNote.trim().slice(0, 2000);
    // reopenedFrom menandai bahwa saat ini adalah pembukaan kembali task DONE/CANCELLED yang wajib beralasan.
    const reopenedFrom = data.status && requiresReopenReason(existing.status, data.status as TaskStatusValue) ? (existing.status as TaskStatusValue) : null;
    if (reopenedFrom && isExecutor(user.role)) return Response.json({ error: "Hanya Lead atau Admin yang dapat membuka kembali task" }, { status: 403 });
    if (reopenedFrom && typeof body.reopenReason === "string" && body.reopenReason.trim().length > TASK_REOPEN_REASON_MAX) return Response.json({ error: `Alasan membuka kembali maksimal ${TASK_REOPEN_REASON_MAX} karakter` }, { status: 400 });
    if (Object.keys(data).length === 0) return Response.json({ error: "Tidak ada perubahan task yang dikirim" }, { status: 400 });
    if (data.priority && user.role !== "ADMIN" && user.role !== "LEAD") return Response.json({ error: "Hanya Lead atau Admin yang dapat mengubah prioritas" }, { status: 403 });
    if (data.status) { const check = validateTaskStatusChange(existing.status as TaskStatusValue, data.status as TaskStatusValue, typeof body.reopenReason === "string" ? body.reopenReason.trim() : ""); if (!check.ok) return Response.json({ error: check.error }, { status: 400 }); }
    if (data.status === "BLOCKED" && !data.blockedReason && !existing.blockedReason) return Response.json({ error: "Alasan blocked wajib diisi" }, { status: 400 });
    if (data.status === "DONE" && !data.completionNote && !existing.completionNote) return Response.json({ error: "Ringkasan hasil wajib diisi" }, { status: 400 });
    // Nilai turunan status dibuat eksplisit: BLOCKED menyimpan alasan, meninggalkan BLOCKED menghapusnya, DONE mengisi completedAt, keluar dari DONE mengosongkannya.
    const statusPatch: Record<string, unknown> = {};
    if (data.status === "BLOCKED") { statusPatch.blockedReason = typeof data.blockedReason === "string" ? data.blockedReason : existing.blockedReason; }
    else if (data.status) { statusPatch.blockedReason = null; }
    if (data.status === "DONE") statusPatch.completedAt = new Date();
    else if (data.status) statusPatch.completedAt = null;
    const changes: Record<string, unknown> = { ...(data as Record<string, unknown>), ...statusPatch };
    if (reopenedFrom && typeof body.reopenReason === "string" && body.reopenReason.trim()) changes.reopenReason = body.reopenReason.trim();
    const updated = await prisma.$transaction(async (tx) => { const result = await tx.task.updateMany({ where: { id, version }, data: { ...data, ...statusPatch, version: { increment: 1 } } }); if (result.count !== 1) throw new Error("TASK_CONFLICT"); const task = await tx.task.findUniqueOrThrow({ where: { id }, include: taskDetailInclude }); await tx.auditLog.create({ data: { actorId: user.id, action: "TASK_UPDATED", objectType: "Task", objectId: id, changes: JSON.parse(JSON.stringify(changes)) } }); return task; }); return Response.json({ task: updated });
  } catch (error) { if (error instanceof Error && error.message === "TASK_CONFLICT") return Response.json({ error: "Task sudah berubah. Muat ulang sebelum menyimpan." }, { status: 409 }); return jsonError(error); }
}
