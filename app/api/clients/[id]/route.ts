import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";
import type { UserRole } from "@prisma/client";
import { isExecutor } from "@/lib/roles";

// Roles allowed to read a client detail. Kept in one place so the scope helper and the
// requireUser() calls below cannot drift apart (the old code let FINANCE reach the scope but
// the route rejected it with 403; MEMBER had to be added here and to clientScope together).
const READ_ROLES: UserRole[] = ["ADMIN", "LEAD", "CMO", "COO"];

// Prisma where-clause matching exactly what READ_ROLES may see: ADMIN sees every client,
// LEAD only clients they lead, MEMBER only clients of programs they are an active member of.
function clientScope(userId: string, role: string) { if (role === "ADMIN") return {}; if (role === "LEAD") return { leadId: userId }; return { programs: { some: { members: { some: { userId, isActive: true } } } } }; }

async function getScopedClient(id: string, userId: string, role: string) {
  const programWhere = isExecutor(role) ? { members: { some: { userId, isActive: true } } } : undefined;
  const client = await prisma.client.findFirst({ where: { id, ...clientScope(userId, role) }, include: { contacts: true, programs: { where: programWhere, include: { tasks: true, members: { include: { user: { select: { id: true, name: true, role: true } } } } } } } });
  if (!client) return null;
  const invoices = isExecutor(role) ? [] : await prisma.invoice.findMany({ where: { clientId: id }, select: { id: true, invoiceNumber: true, status: true, totalAmount: true, dueDate: true } });
  return { ...client, invoices };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const user = await requireUser(READ_ROLES); const { id } = await params; const client = await getScopedClient(id, user.id, user.role); if (!client) return Response.json({ error: "Client tidak ditemukan" }, { status: 404 }); return Response.json({ client }); } catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; assertSameOrigin(request); const user = await requireUser(["ADMIN", "LEAD", "COO"]); const existing = await getScopedClient(id, user.id, user.role); if (!existing) return Response.json({ error: "Client tidak ditemukan" }, { status: 404 });
    const body = await request.json().catch(() => ({})); const data: Record<string, string | null> = {};
    for (const field of ["businessName", "sector", "address", "notes"]) if (typeof body[field] === "string") data[field] = body[field].trim().slice(0, field === "notes" ? 2000 : field === "address" ? 300 : 160);
    if (typeof body.status === "string" && ["PROSPECT", "ACTIVE", "INACTIVE", "ARCHIVED"].includes(body.status)) data.status = body.status;
    if (Object.keys(data).length === 0) return Response.json({ error: "Tidak ada perubahan valid" }, { status: 400 });
    if (data.status === "ARCHIVED") {
      const openProgram = await prisma.program.count({ where: { clientId: id, status: { in: ["PLANNED", "ACTIVE", "ON_HOLD"] } } });
      const invoices = await prisma.invoice.findMany({ where: { clientId: id, status: "ISSUED" }, select: { totalAmount: true, payments: { where: { status: "VALID" }, select: { amount: true } } } });
      const openInvoice = invoices.some((invoice) => invoice.totalAmount - invoice.payments.reduce((sum, payment) => sum + payment.amount, 0) > 0) ? 1 : 0;
      if (openProgram || openInvoice) return Response.json({ error: "Client masih memiliki program atau kewajiban terbuka" }, { status: 409 });
    }
    const client = await prisma.$transaction(async (tx) => { const updated = await tx.client.update({ where: { id }, data }); await tx.auditLog.create({ data: { actorId: user.id, action: "CLIENT_UPDATED", objectType: "Client", objectId: id, changes: data } }); return updated; });
    return Response.json({ client });
  } catch (error) { return jsonError(error); }
}
