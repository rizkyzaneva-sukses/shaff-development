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

    const body = await request.json().catch(() => ({}));
    const text = typeof body.body === "string" ? body.body.trim().slice(0, 3000) : "";
    if (!text) return Response.json({ error: "Isi komentar tidak boleh kosong" }, { status: 400 });

    const comment = await prisma.taskComment.create({
      data: {
        taskId: id,
        authorId: user.id,
        body: text,
      },
      include: {
        author: {
          select: { id: true, name: true, jobTitle: true, role: true },
        },
      },
    });

    return Response.json({ comment }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
