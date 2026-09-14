import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";

function invoiceScope(userId: string, role: string) { if (role === "ADMIN" || role === "FINANCE") return {}; if (role === "LEAD") return { client: { leadId: userId } }; return { program: { members: { some: { userId, isActive: true } } } }; }

export async function GET() {
  try {
    const user = await requireUser(["ADMIN", "LEAD", "FINANCE"]);
    if (user.role === "LEAD") {
      const invoices = await prisma.invoice.findMany({ where: invoiceScope(user.id, user.role), select: { id: true, invoiceNumber: true, dueDate: true, status: true, approvalStatus: true, totalAmount: true, client: { select: { businessName: true } }, program: { select: { name: true } }, payments: { where: { status: "VALID" }, select: { amount: true } } }, orderBy: { dueDate: "asc" } });
      return Response.json({ invoices: invoices.map((invoice) => { const paidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0); return { id: invoice.id, invoiceNumber: invoice.invoiceNumber, dueDate: invoice.dueDate, status: invoice.status, approvalStatus: invoice.approvalStatus, totalAmount: invoice.totalAmount, paidAmount, balance: invoice.totalAmount - paidAmount, client: invoice.client, program: invoice.program }; }) });
    }
    const invoices = await prisma.invoice.findMany({ where: invoiceScope(user.id, user.role), include: { client: { select: { id: true, businessName: true } }, program: { select: { id: true, name: true } }, items: true, payments: { where: { status: "VALID" }, select: { id: true, amount: true, paidAt: true, method: true } } }, orderBy: { dueDate: "asc" } });
    const mapped = invoices.map((invoice) => ({ ...invoice, paidAmount: invoice.payments.reduce((sum, payment) => sum + payment.amount, 0), balance: invoice.totalAmount - invoice.payments.reduce((sum, payment) => sum + payment.amount, 0) }));
    return Response.json({ invoices: mapped });
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const user = await requireUser(["ADMIN", "FINANCE"]); const body = await request.json().catch(() => ({})); const clientId = typeof body.clientId === "string" ? body.clientId : ""; const programId = typeof body.programId === "string" ? body.programId : ""; const issueDate = new Date(body.issueDate); const dueDate = new Date(body.dueDate); const items = Array.isArray(body.items) ? body.items : [];
    if (!clientId || !programId || Number.isNaN(issueDate.getTime()) || Number.isNaN(dueDate.getTime()) || dueDate < issueDate || items.length < 1 || items.length > 50) return Response.json({ error: "Client, program, tanggal, dan item invoice harus valid" }, { status: 400 });
    const program = await prisma.program.findFirst({ where: { id: programId, clientId }, include: { client: true } }); if (!program) return Response.json({ error: "Program dan client tidak cocok" }, { status: 400 });
    const normalized: Array<{ description: string; quantity: number; unitPrice: number; amount: number }> = items.map((item: unknown) => { const row = item as Record<string, unknown>; const description = typeof row.description === "string" ? row.description.trim().slice(0, 240) : ""; const quantity = Number(row.quantity); const unitPrice = Number(row.unitPrice); if (!description || !Number.isSafeInteger(quantity) || quantity <= 0 || !Number.isSafeInteger(unitPrice) || unitPrice < 0) throw new Error("INVALID_ITEM"); return { description, quantity, unitPrice, amount: quantity * unitPrice }; }); const totalAmount = normalized.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0); if (!Number.isSafeInteger(totalAmount) || totalAmount <= 0) return Response.json({ error: "Total invoice harus positif" }, { status: 400 });
    const organization = await prisma.organizationSettings.findUnique({ where: { id: "organization" } }); const invoice = await prisma.$transaction(async (tx) => { const created = await tx.invoice.create({ data: { clientId, programId, createdById: user.id, issueDate, dueDate, clientNameSnapshot: program.client.businessName, clientAddressSnapshot: program.client.address, organizationNameSnapshot: organization?.name ?? "Shaff Development", bankSnapshot: organization?.bankName && organization.bankAccountNo ? `${organization.bankName} · ${organization.bankAccountNo}` : null, totalAmount, items: { create: normalized } } }); await tx.auditLog.create({ data: { actorId: user.id, action: "INVOICE_CREATED", objectType: "Invoice", objectId: created.id, changes: { clientId, programId, totalAmount } } }); return created; }); return Response.json({ invoice }, { status: 201 });
  } catch (error) { if (error instanceof Error && error.message === "INVALID_ITEM") return Response.json({ error: "Item invoice tidak valid" }, { status: 400 }); return jsonError(error); }
}
