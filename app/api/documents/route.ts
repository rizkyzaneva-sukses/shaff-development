import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";
import { deletePrivateFile, savePrivateFile } from "@/lib/storage";
import type { Prisma } from "@prisma/client";

function programWhere(userId: string, role: string, programId: string) { return { id: programId, ...(role === "ADMIN" || role === "FINANCE" ? {} : role === "LEAD" ? { client: { leadId: userId } } : { members: { some: { userId, isActive: true } } }) }; }

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const programId = new URL(request.url).searchParams.get("programId");
    const where: Prisma.DocumentWhereInput = {
      ...(programId ? { programId } : {}),
      ...(user.role === "ADMIN" ? {} : { category: user.role === "FINANCE" ? "PAYMENT_PROOF" : { not: "PAYMENT_PROOF" } }),
      ...(user.role === "LEAD" ? { program: { client: { leadId: user.id } } } : user.role === "MEMBER" ? { program: { members: { some: { userId: user.id, isActive: true } } } } : {}),
    };
    const documents = await prisma.document.findMany({
      where,
      select: {
        id: true, clientId: true, programId: true, uploadedById: true, displayName: true,
        mimeType: true, sizeBytes: true, category: true, isArchived: true, version: true,
        reviewStatus: true, reviewedById: true, reviewedAt: true, reviewNote: true, createdAt: true,
        client: { select: { businessName: true } },
        program: { select: { name: true } },
        uploadedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ documents });
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  let savedKey: string | null = null;
  try {
    assertSameOrigin(request); const user = await requireUser(["ADMIN", "LEAD", "MEMBER", "FINANCE"]); const form = await request.formData(); const programId = String(form.get("programId") || ""); const category = String(form.get("category") || "OTHER"); const file = form.get("file"); if (!(file instanceof File)) return Response.json({ error: "File wajib diunggah" }, { status: 400 }); if (category === "PAYMENT_PROOF" && !["ADMIN", "FINANCE"].includes(user.role)) return Response.json({ error: "Bukti pembayaran hanya dapat diunggah Finance atau Admin" }, { status: 403 }); if (user.role === "FINANCE" && category !== "PAYMENT_PROOF") return Response.json({ error: "Finance hanya dapat mengunggah bukti pembayaran" }, { status: 403 }); if (!["ADMINISTRATION", "ASSESSMENT", "MATERIAL", "DELIVERABLE", "OTHER", "PAYMENT_PROOF"].includes(category)) return Response.json({ error: "Kategori dokumen tidak valid" }, { status: 400 }); const program = await prisma.program.findFirst({ where: programWhere(user.id, user.role, programId), select: { id: true, clientId: true, status: true } }); if (!program) return Response.json({ error: "Program tidak ditemukan atau sudah ditutup" }, { status: 404 }); if (["COMPLETED", "CANCELLED"].includes(program.status) && user.role === "MEMBER") return Response.json({ error: "Program sudah ditutup" }, { status: 409 }); const displayName = file.name.replace(/[\u0000-\u001f\\/]/g, "_").slice(0, 180) || "dokumen"; const stored = await savePrivateFile(file); savedKey = stored.key; const document = await prisma.$transaction(async (tx) => { const created = await tx.document.create({ data: { clientId: program.clientId, programId: program.id, uploadedById: user.id, displayName, storageKey: stored.key, mimeType: stored.mimeType, sizeBytes: stored.sizeBytes, category: category as never }, select: { id: true, clientId: true, programId: true, displayName: true, category: true, sizeBytes: true } }); await tx.auditLog.create({ data: { actorId: user.id, action: "DOCUMENT_UPLOADED", objectType: "Document", objectId: created.id, changes: { programId, category, sizeBytes: stored.sizeBytes } } }); return created; }); return Response.json({ document }, { status: 201 });
  } catch (error) { if (savedKey) await deletePrivateFile(savedKey); if (error instanceof Error && error.message === "INVALID_FILE") return Response.json({ error: "File tidak didukung, rusak, kosong, atau melebihi 20 MB" }, { status: 400 }); return jsonError(error); }
}
