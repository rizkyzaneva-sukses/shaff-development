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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN", "LEAD", "MEMBER"]);
    const task = await verifyTaskAccess(id, user.id, user.role);
    if (!task) return Response.json({ error: "Task tidak ditemukan atau di luar akses" }, { status: 404 });
    if (["COMPLETED", "CANCELLED"].includes(task.program.status)) {
      return Response.json({ error: "Program sudah selesai atau dibatalkan" }, { status: 409 });
    }

    const body = await request.json().catch(() => ({}));
    const label = typeof body.label === "string" ? body.label.trim().slice(0, 300) : "";
    if (!label) return Response.json({ error: "Label checklist wajib diisi" }, { status: 400 });

    const count = await prisma.taskChecklistItem.count({ where: { taskId: id } });
    const item = await prisma.taskChecklistItem.create({
      data: {
        taskId: id,
        label,
        sortOrder: count,
        isDone: false,
      },
    });

    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN", "LEAD", "MEMBER"]);
    const task = await verifyTaskAccess(id, user.id, user.role);
    if (!task) return Response.json({ error: "Task tidak ditemukan atau di luar akses" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const itemId = typeof body.itemId === "string" ? body.itemId : "";
    if (!itemId) return Response.json({ error: "ID checklist wajib diisi" }, { status: 400 });

    const existingItem = await prisma.taskChecklistItem.findFirst({
      where: { id: itemId, taskId: id },
    });
    if (!existingItem) return Response.json({ error: "Item checklist tidak ditemukan" }, { status: 404 });

    const updateData: { isDone?: boolean; label?: string } = {};
    if (typeof body.isDone === "boolean") updateData.isDone = body.isDone;
    if (typeof body.label === "string" && body.label.trim()) updateData.label = body.label.trim().slice(0, 300);

    const item = await prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return Response.json({ item });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN", "LEAD", "MEMBER"]);
    const task = await verifyTaskAccess(id, user.id, user.role);
    if (!task) return Response.json({ error: "Task tidak ditemukan atau di luar akses" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) return Response.json({ error: "ID checklist wajib diisi" }, { status: 400 });

    await prisma.taskChecklistItem.deleteMany({
      where: { id: itemId, taskId: id },
    });

    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
