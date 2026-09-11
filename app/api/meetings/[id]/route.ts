import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";

function scope(userId: string, role: string) { if (role === "ADMIN") return {}; if (role === "LEAD") return { client: { leadId: userId } }; return { members: { some: { userId, isActive: true } } }; }

function validateJsonDoc(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  const doc = value as Record<string, unknown>;
  if (doc.type !== "doc" || !Array.isArray(doc.content)) return null;
  return doc;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; assertSameOrigin(request); const user = await requireUser(["ADMIN", "LEAD", "MEMBER"]); const body = await request.json().catch(() => ({}));
    const current = await prisma.meetingNote.findFirst({ where: { id, program: scope(user.id, user.role) }, include: { program: true } });
    if (!current) return Response.json({ error: "Meeting tidak ditemukan" }, { status: 404 });
    if (current.status === "FINAL" && user.role !== "ADMIN" && current.creatorId !== user.id) return Response.json({ error: "Meeting final hanya dapat dikoreksi pembuat atau Admin" }, { status: 403 });

    const status = body.status === "FINAL" ? "FINAL" : "DRAFT";
    const summary = typeof body.summary === "string" ? body.summary.trim().slice(0, 5000) : current.summary;
    const decisions = typeof body.decisions === "string" ? body.decisions.trim().slice(0, 5000) : current.decisions;
    const summaryJson = body.summaryJson !== undefined ? validateJsonDoc(body.summaryJson) : current.summaryJson;
    const summaryText = typeof body.summaryText === "string" ? body.summaryText.trim().slice(0, 10000) : current.summaryText;
    const decisionsJson = body.decisionsJson !== undefined ? validateJsonDoc(body.decisionsJson) : current.decisionsJson;
    const decisionsText = typeof body.decisionsText === "string" ? body.decisionsText.trim().slice(0, 10000) : current.decisionsText;

    // For FINAL: require content in either old or new format
    const hasSummary = summary || summaryText;
    const hasDecisions = decisions || decisionsText;
    if (status === "FINAL" && (!hasSummary || !hasDecisions)) return Response.json({ error: "Meeting final wajib memiliki ringkasan dan keputusan" }, { status: 400 });

    const meeting = await prisma.$transaction(async (tx) => { const updated = await tx.meetingNote.update({ where: { id }, data: { summary, summaryJson, summaryText, decisions, decisionsJson, decisionsText, participants: typeof body.participants === "string" ? body.participants.trim().slice(0, 1000) : current.participants, status, correctionReason: current.status === "FINAL" && typeof body.correctionReason === "string" ? body.correctionReason.trim().slice(0, 1000) : current.correctionReason } }); await tx.auditLog.create({ data: { actorId: user.id, action: status === "FINAL" ? "MEETING_FINALIZED" : "MEETING_UPDATED", objectType: "MeetingNote", objectId: id, reason: typeof body.correctionReason === "string" ? body.correctionReason : undefined, changes: { status } } }); return updated; });
    return Response.json({ meeting });
  } catch (error) { return jsonError(error); }
}
