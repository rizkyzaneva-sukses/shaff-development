import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";
import { taskBoardInclude } from "@/lib/task-query";
import type { UserRole } from "@prisma/client";
import { isExecutor } from "@/lib/roles";

// Roles allowed to read the task board. GET and POST below must call requireUser(READ_ROLES)
// so the enforced role list and the scope helper below can never disagree.
const READ_ROLES: UserRole[] = ["ADMIN", "LEAD", "CMO", "COO"];

// Scope mirrors READ_ROLES exactly: ADMIN sees all tasks; LEAD only tasks of clients they lead;
// MEMBER only tasks assigned to them. FINANCE is intentionally absent (no task-board access).
function scope(userId: string, role: string) { if (role === "ADMIN") return {}; if (role === "LEAD") return { program: { client: { leadId: userId } } }; if (role === "CMO" || role === "COO") return { assigneeId: userId }; return { id: "__no_task_access__" }; }

export async function GET() { try { const user = await requireUser(READ_ROLES); const tasks = await prisma.task.findMany({ where: scope(user.id, user.role), include: taskBoardInclude, orderBy: [{ dueDate: "asc" }, { priority: "desc" }] }); return Response.json({ tasks }); } catch (error) { return jsonError(error); } }

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const user = await requireUser(READ_ROLES); const body = await request.json().catch(() => ({})); const programId = typeof body.programId === "string" ? body.programId : ""; const title = typeof body.title === "string" ? body.title.trim() : ""; const dueDate = new Date(body.dueDate); if (!programId || !title || title.length > 240 || Number.isNaN(dueDate.getTime())) return Response.json({ error: "Program, judul, dan deadline wajib valid" }, { status: 400 });
    const program = await prisma.program.findFirst({ where: { id: programId, ...(user.role === "ADMIN" ? {} : user.role === "LEAD" ? { client: { leadId: user.id } } : { members: { some: { userId: user.id, isActive: true } } }) }, include: { members: { where: { isActive: true }, select: { userId: true } } } }); if (!program || ["COMPLETED", "CANCELLED"].includes(program.status)) return Response.json({ error: "Program tidak dapat menerima task baru" }, { status: 409 });
    const assigneeId = isExecutor(user.role) ? user.id : typeof body.assigneeId === "string" ? body.assigneeId : user.id; if (!program.members.some((member) => member.userId === assigneeId)) return Response.json({ error: "Assignee harus menjadi anggota aktif program" }, { status: 400 }); const priority = ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(body.priority) ? body.priority : "MEDIUM";
    const task = await prisma.$transaction(async (tx) => { const created = await tx.task.create({ data: { programId, assigneeId, title: title.slice(0, 240), description: typeof body.description === "string" ? body.description.trim().slice(0, 5000) : null, dueDate, priority }, include: taskBoardInclude }); await tx.auditLog.create({ data: { actorId: user.id, action: "TASK_CREATED", objectType: "Task", objectId: created.id, changes: { programId, assigneeId, priority } } }); return created; }); return Response.json({ task }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
