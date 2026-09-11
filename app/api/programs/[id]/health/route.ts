import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";

function scopeFor(userId: string, role: string) {
  if (role === "ADMIN" || role === "FINANCE") return {};
  if (role === "LEAD") return { client: { leadId: userId } };
  return { members: { some: { userId, isActive: true } } };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN", "LEAD"]);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const risk = body.risk === "HEALTHY" || body.risk === "ATTENTION" || body.risk === "CRITICAL" ? body.risk : null;
    const score = body.healthScore === null || body.healthScore === undefined ? null : Number(body.healthScore);
    if (risk === null && score === null && body.riskNote === undefined) return Response.json({ error: "Tidak ada perubahan health program" }, { status: 400 });
    if (score !== null && (!Number.isInteger(score) || score < 0 || score > 100)) return Response.json({ error: "Health score harus berupa angka 0 sampai 100" }, { status: 400 });
    const program = await prisma.program.findFirst({ where: { id, ...scopeFor(user.id, user.role) }, select: { id: true, risk: true, healthScore: true, riskNote: true } });
    if (!program) return Response.json({ error: "Program tidak ditemukan" }, { status: 404 });
    const riskNote = body.riskNote === null ? null : typeof body.riskNote === "string" ? body.riskNote.trim().slice(0, 2000) : undefined;
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.program.update({
        where: { id },
        data: {
          ...(risk ? { risk } : {}),
          ...(score !== null || body.healthScore === null ? { healthScore: score } : {}),
          ...(riskNote !== undefined ? { riskNote } : {})
        },
        select: { id: true, healthScore: true, risk: true, riskNote: true, updatedAt: true }
      });
      await tx.auditLog.create({ data: { actorId: user.id, action: "PROGRAM_HEALTH_UPDATED", objectType: "Program", objectId: id, changes: { before: program, after: result } } });
      return result;
    });
    return Response.json({ program: updated });
  } catch (error) {
    return jsonError(error);
  }
}
