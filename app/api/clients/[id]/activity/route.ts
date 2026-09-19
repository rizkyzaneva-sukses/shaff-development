import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";
import { isExecutor } from "@/lib/roles";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const user = await requireUser(["ADMIN", "LEAD", "CMO", "COO", "FINANCE"]);
    const client = await prisma.client.findFirst({ where: { id, ...(user.role === "ADMIN" || user.role === "FINANCE" ? {} : user.role === "LEAD" ? { leadId: user.id } : { programs: { some: { members: { some: { userId: user.id, isActive: true } } } } }) }, select: { id: true, programs: { where: isExecutor(user.role) ? { members: { some: { userId: user.id, isActive: true } } } : undefined, select: { id: true, tasks: { where: user.role === "FINANCE" ? { id: "__none__" } : user.role === "CMO" ? { assigneeId: user.id } : undefined, select: { id: true } }, meetings: { where: user.role === "FINANCE" ? { id: "__none__" } : undefined, select: { id: true } }, documents: { where: user.role === "ADMIN" ? undefined : { category: user.role === "FINANCE" ? "PAYMENT_PROOF" : { not: "PAYMENT_PROOF" } }, select: { id: true } }, invoices: { where: user.role === "CMO" ? { id: "__none__" } : undefined, select: { id: true } } } } } });
    if (!client) return Response.json({ error: "Client tidak ditemukan" }, { status: 404 });
    const objectIds = [id, ...client.programs.flatMap((program) => [program.id, ...program.tasks.map((task) => task.id), ...program.meetings.map((meeting) => meeting.id), ...program.documents.map((document) => document.id), ...program.invoices.map((invoice) => invoice.id)])];
    const url = new URL(request.url); const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
    const logs = await prisma.auditLog.findMany({ where: { objectId: { in: objectIds } }, include: { actor: { select: { name: true, jobTitle: true } } }, orderBy: { createdAt: "desc" }, take: limit });
    return Response.json({ activity: logs });
  } catch (error) { return jsonError(error); }
}
