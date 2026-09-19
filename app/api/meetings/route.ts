import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";

function programScope(userId: string, role: string) { if (role === "ADMIN") return {}; if (role === "LEAD") return { client: { leadId: userId } }; return { members: { some: { userId, isActive: true } } }; }

function validateJsonDoc(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  const doc = value as Record<string, unknown>;
  if (doc.type !== "doc" || !Array.isArray(doc.content)) return null;
  return doc;
}

export async function GET() { try { const user = await requireUser(["ADMIN", "LEAD", "CMO", "COO"]); const meetings = await prisma.meetingNote.findMany({ where: { program: programScope(user.id, user.role) }, include: { client: { select: { id: true, businessName: true } }, program: { select: { id: true, name: true } }, actionItems: { include: { task: true } } }, orderBy: { meetingAt: "desc" } }); return Response.json({ meetings }); } catch (error) { return jsonError(error); } }

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const user = await requireUser(["ADMIN", "LEAD", "CMO", "COO"]); const body = await request.json().catch(() => ({})); const clientId = typeof body.clientId === "string" ? body.clientId : ""; const programId = typeof body.programId === "string" ? body.programId : ""; const title = typeof body.title === "string" ? body.title.trim() : ""; const meetingAt = new Date(body.meetingAt); const status = body.status === "FINAL" ? "FINAL" : "DRAFT"; const actionItems = Array.isArray(body.actionItems) ? body.actionItems : [];
    if (!clientId || !programId || !title || title.length > 240 || Number.isNaN(meetingAt.getTime()) || actionItems.length > 50) return Response.json({ error: "Meeting dan waktunya harus valid" }, { status: 400 }); const program = await prisma.program.findFirst({ where: { id: programId, clientId, ...programScope(user.id, user.role) } }); if (!program || ["COMPLETED", "CANCELLED"].includes(program.status)) return Response.json({ error: "Program tidak ditemukan atau sudah ditutup" }, { status: 404 });

    // Accept both old text fields and new JSON fields
    const summary = typeof body.summary === "string" ? body.summary.trim().slice(0, 5000) : null;
    const decisions = typeof body.decisions === "string" ? body.decisions.trim().slice(0, 5000) : null;
    const summaryJson = validateJsonDoc(body.summaryJson) as any;
    const summaryText = typeof body.summaryText === "string" ? body.summaryText.trim().slice(0, 10000) : undefined;
    const decisionsJson = validateJsonDoc(body.decisionsJson) as any;
    const decisionsText = typeof body.decisionsText === "string" ? body.decisionsText.trim().slice(0, 10000) : undefined;

    // For FINAL: require content in either old or new format
    const hasSummary = summary || summaryText;
    const hasDecisions = decisions || decisionsText;
    if (status === "FINAL" && (!hasSummary || !hasDecisions)) return Response.json({ error: "Meeting final wajib memiliki ringkasan dan keputusan" }, { status: 400 });

    const normalizedActions = actionItems.map((item: unknown) => { const row = item as Record<string, unknown>; const description = typeof row.description === "string" ? row.description.trim().slice(0, 1000) : ""; const noTaskReason = typeof row.noTaskReason === "string" ? row.noTaskReason.trim().slice(0, 500) : null; if (!description || (!noTaskReason && row.taskId == null)) throw new Error("INVALID_ACTION"); return { description, noTaskReason, taskId: typeof row.taskId === "string" ? row.taskId : null }; });
    const meeting = await prisma.$transaction(async (tx) => { for (const action of normalizedActions) if (action.taskId) { const task = await tx.task.findFirst({ where: { id: action.taskId, programId } }); if (!task) throw new Error("INVALID_ACTION_TASK"); } const created = await tx.meetingNote.create({ data: { clientId, programId, creatorId: user.id, title, meetingAt, participants: typeof body.participants === "string" ? body.participants.trim().slice(0, 1000) : null, summary, summaryJson, summaryText, decisions, decisionsJson, decisionsText, status, actionItems: { create: normalizedActions } }, include: { actionItems: true } }); await tx.auditLog.create({ data: { actorId: user.id, action: status === "FINAL" ? "MEETING_FINALIZED" : "MEETING_CREATED", objectType: "MeetingNote", objectId: created.id, changes: { status, actionCount: normalizedActions.length } } }); return created; }); return Response.json({ meeting }, { status: 201 });
  } catch (error) { if (error instanceof Error && (error.message === "INVALID_ACTION" || error.message === "INVALID_ACTION_TASK")) return Response.json({ error: "Setiap tindak lanjut harus memiliki task atau alasan tidak dibuat" }, { status: 400 }); return jsonError(error); }
}
