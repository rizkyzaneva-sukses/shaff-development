import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";
import { canManageDocument } from "@/lib/document-access";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; assertSameOrigin(request); const user = await requireUser(["ADMIN", "LEAD", "CMO", "COO", "FINANCE"]); const current = await prisma.document.findUnique({ where: { id }, include: { program: { include: { client: true, members: true } } } });
    if (!current) return Response.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
    if (!canManageDocument(user, current)) return Response.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
    const body = await request.json().catch(() => ({})); const isArchived = typeof body.isArchived === "boolean" ? body.isArchived : !current.isArchived;
    const document = await prisma.$transaction(async (tx) => { const updated = await tx.document.update({ where: { id }, data: { isArchived }, select: { id: true, isArchived: true } }); await tx.auditLog.create({ data: { actorId: user.id, action: isArchived ? "DOCUMENT_ARCHIVED" : "DOCUMENT_RESTORED", objectType: "Document", objectId: id, changes: { isArchived } } }); return updated; });
    return Response.json({ document });
  } catch (error) { return jsonError(error); }
}
