import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";

async function verifyTaskAccess(taskId: string, userId: string, role: string) {
  return prisma.task.findFirst({
    where: {
      id: taskId,
      ...(role === "ADMIN"
        ? {}
        : role === "LEAD"
        ? { program: { client: { leadId: userId } } }
        : {
            OR: [
              { assigneeId: userId },
              { program: { members: { some: { userId, isActive: true } } } },
            ],
          }),
    },
    include: { program: true },
  });
}

// Guard program terminal dipakai seragam oleh POST, PATCH, dan DELETE.
function isTerminalProgram(status: string) {
  return status === "COMPLETED" || status === "CANCELLED";
}

// Konkurensi optimistik mengikuti pola app/api/tasks/[id]/route.ts. TaskChecklistItem tidak punya kolom `version`,
// sehingga pembandingnya adalah Task.version yang dinaikkan di dalam transaksi yang sama.
const TASK_CHANGED = { error: "Task sudah berubah. Muat ulang sebelum menyimpan." };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN", "LEAD", "CMO", "COO"]);
    const task = await verifyTaskAccess(id, user.id, user.role);
    if (!task) return Response.json({ error: "Task tidak ditemukan atau di luar akses" }, { status: 404 });
    if (isTerminalProgram(task.program.status)) {
      return Response.json({ error: "Program sudah selesai atau dibatalkan" }, { status: 409 });
    }

    const body = await request.json().catch(() => ({}));
    const label = typeof body.label === "string" ? body.label.trim().slice(0, 300) : "";
    if (!label) return Response.json({ error: "Label checklist wajib diisi" }, { status: 400 });
    const version = body.version === undefined || body.version === null ? null : Number(body.version);
    if (version !== null && (!Number.isInteger(version) || version !== task.version)) return Response.json(TASK_CHANGED, { status: 409 });

    const result = await prisma.$transaction(async (tx) => {
      // Versi diperiksa dan dinaikkan di dalam transaksi yang sama dengan penulisan item.
      if (version !== null) { const guard = await tx.task.updateMany({ where: { id, version }, data: { version: { increment: 1 } } }); if (guard.count !== 1) throw new Error("TASK_CONFLICT"); }
      // sortOrder deterministik: nilai terbesar + 1 dihitung di dalam transaksi, bukan dari count().
      const last = await tx.taskChecklistItem.findFirst({ where: { taskId: id }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
      const item = await tx.taskChecklistItem.create({ data: { taskId: id, label, sortOrder: (last?.sortOrder ?? -1) + 1, isDone: false } });
      await tx.auditLog.create({ data: { actorId: user.id, action: "CHECKLIST_ITEM_ADDED", objectType: "TaskChecklistItem", objectId: item.id, changes: { taskId: id, label: item.label, sortOrder: item.sortOrder, version: version ?? task.version } } });
      return item;
    });

    return Response.json({ item: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "TASK_CONFLICT") return Response.json(TASK_CHANGED, { status: 409 });
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN", "LEAD", "CMO", "COO"]);
    const task = await verifyTaskAccess(id, user.id, user.role);
    if (!task) return Response.json({ error: "Task tidak ditemukan atau di luar akses" }, { status: 404 });
    if (isTerminalProgram(task.program.status)) {
      return Response.json({ error: "Program sudah selesai atau dibatalkan" }, { status: 409 });
    }

    const body = await request.json().catch(() => ({}));
    const itemId = typeof body.itemId === "string" ? body.itemId : "";
    if (!itemId) return Response.json({ error: "ID checklist wajib diisi" }, { status: 400 });
    const version = body.version === undefined || body.version === null ? null : Number(body.version);
    if (version !== null && (!Number.isInteger(version) || version !== task.version)) return Response.json(TASK_CHANGED, { status: 409 });

    const updateData: { isDone?: boolean; label?: string } = {};
    if (typeof body.isDone === "boolean") updateData.isDone = body.isDone;
    if (typeof body.label === "string" && body.label.trim()) updateData.label = body.label.trim().slice(0, 300);
    if (Object.keys(updateData).length === 0) return Response.json({ error: "Tidak ada perubahan checklist yang dikirim" }, { status: 400 });

    const { item, previous } = await prisma.$transaction(async (tx) => {
      const existingItem = await tx.taskChecklistItem.findFirst({ where: { id: itemId, taskId: id } });
      if (!existingItem) throw new Error("ITEM_NOT_FOUND");
      if (version !== null) { const guard = await tx.task.updateMany({ where: { id, version }, data: { version: { increment: 1 } } }); if (guard.count !== 1) throw new Error("TASK_CONFLICT"); }
      const updated = await tx.taskChecklistItem.update({ where: { id: itemId }, data: updateData });
      await tx.auditLog.create({ data: { actorId: user.id, action: "CHECKLIST_ITEM_UPDATED", objectType: "TaskChecklistItem", objectId: itemId, changes: { taskId: id, ...updateData, ...(version === null ? {} : { version: task.version }) } } });
      return { item: updated, previous: existingItem };
    });

    void previous;
    return Response.json({ item });
  } catch (error) {
    if (error instanceof Error && error.message === "TASK_CONFLICT") return Response.json(TASK_CHANGED, { status: 409 });
    if (error instanceof Error && error.message === "ITEM_NOT_FOUND") return Response.json({ error: "Item checklist tidak ditemukan" }, { status: 404 });
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN", "LEAD", "CMO", "COO"]);
    const task = await verifyTaskAccess(id, user.id, user.role);
    if (!task) return Response.json({ error: "Task tidak ditemukan atau di luar akses" }, { status: 404 });
    if (isTerminalProgram(task.program.status)) {
      return Response.json({ error: "Program sudah selesai atau dibatalkan" }, { status: 409 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) return Response.json({ error: "ID checklist wajib diisi" }, { status: 400 });
    const rawVersion = searchParams.get("version");
    const version = rawVersion === null || rawVersion === "" ? null : Number(rawVersion);
    if (version !== null && (!Number.isInteger(version) || version !== task.version)) return Response.json(TASK_CHANGED, { status: 409 });

    const removed = await prisma.$transaction(async (tx) => {
      const existingItem = await tx.taskChecklistItem.findFirst({ where: { id: itemId, taskId: id } });
      if (!existingItem) throw new Error("ITEM_NOT_FOUND");
      if (version !== null) { const guard = await tx.task.updateMany({ where: { id, version }, data: { version: { increment: 1 } } }); if (guard.count !== 1) throw new Error("TASK_CONFLICT"); }
      const result = await tx.taskChecklistItem.deleteMany({ where: { id: itemId, taskId: id } });
      await tx.auditLog.create({ data: { actorId: user.id, action: "CHECKLIST_ITEM_DELETED", objectType: "TaskChecklistItem", objectId: itemId, changes: { taskId: id, label: existingItem.label, isDone: existingItem.isDone, deleted: result.count } } });
      return result;
    });

    return Response.json({ ok: true, deleted: removed.count });
  } catch (error) {
    if (error instanceof Error && error.message === "TASK_CONFLICT") return Response.json(TASK_CHANGED, { status: 409 });
    if (error instanceof Error && error.message === "ITEM_NOT_FOUND") return Response.json({ error: "Item checklist tidak ditemukan" }, { status: 404 });
    return jsonError(error);
  }
}
