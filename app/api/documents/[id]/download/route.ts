import { prisma } from "@/lib/prisma";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { readPrivateFile } from "@/lib/storage";
import { canReadDocument } from "@/lib/document-access";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const user = await getCurrentUser(); if (!user) return Response.json({ error: "Autentikasi diperlukan" }, { status: 401 }); const { id } = await params; const document = await prisma.document.findUnique({ where: { id }, include: { program: { include: { client: true, members: true } } } }); if (!document || document.isArchived || !canReadDocument(user, document)) return Response.json({ error: "Dokumen tidak ditemukan" }, { status: 404 }); const buffer = await readPrivateFile(document.storageKey); return new Response(buffer as unknown as BodyInit, { headers: { "content-type": document.mimeType, "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.displayName)}`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } }); } catch (error) { return jsonError(error); }
}
