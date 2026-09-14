import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";
import { isFinanceConflict, serializableTransaction } from "@/lib/finance-transaction";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN", "FINANCE"]);
    const body = await request.json().catch(() => ({}));
    const approvalStatus = ["APPROVED", "REJECTED"].includes(body.approvalStatus) ? body.approvalStatus : null;
    if (!approvalStatus) return Response.json({ error: "Status approval tidak valid" }, { status: 400 });
    const updated = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id }, select: { status: true } });
      if (!invoice) throw new Error("NOT_FOUND");
      if (invoice.status !== "DRAFT") throw new Error("NOT_DRAFT");
      const result = await tx.invoice.update({ where: { id }, data: { approvalStatus, approvedById: user.id, approvedAt: new Date() } });
      await tx.auditLog.create({ data: { actorId: user.id, action: approvalStatus === "APPROVED" ? "INVOICE_APPROVED" : "INVOICE_REJECTED", objectType: "Invoice", objectId: id, reason: typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : undefined } });
      return result;
    }, serializableTransaction);
    return Response.json({ invoice: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return Response.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    if (error instanceof Error && error.message === "NOT_DRAFT") return Response.json({ error: "Hanya draft invoice yang dapat di-approve" }, { status: 409 });
    if (isFinanceConflict(error)) return Response.json({ error: "Data keuangan berubah bersamaan. Muat ulang lalu coba lagi." }, { status: 409 });
    return jsonError(error);
  }
}
