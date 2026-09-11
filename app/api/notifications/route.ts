import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";

function programScope(userId: string, role: string) {
  if (role === "ADMIN" || role === "FINANCE") return {};
  if (role === "LEAD") return { client: { leadId: userId } };
  return { members: { some: { userId, isActive: true } } };
}

function clientScope(userId: string, role: string) {
  if (role === "ADMIN" || role === "FINANCE") return {};
  if (role === "LEAD") return { leadId: userId };
  return { programs: { some: { members: { some: { userId, isActive: true } } } } };
}

function taskScope(userId: string, role: string) {
  if (role === "ADMIN" || role === "FINANCE") return {};
  if (role === "LEAD") return { program: { client: { leadId: userId } } };
  return { assigneeId: userId };
}

function invoiceScope(userId: string, role: string) {
  if (role === "ADMIN" || role === "FINANCE") return {};
  if (role === "LEAD") return { client: { leadId: userId } };
  return { program: { members: { some: { userId, isActive: true } } } };
}

export async function GET() {
  try {
    const user = await requireUser();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const invoicePromise = user.role === "MEMBER" ? Promise.resolve([]) : prisma.invoice.findMany({ where: { ...invoiceScope(user.id, user.role), status: "ISSUED", dueDate: { lt: today } }, include: { client: { select: { businessName: true } }, program: { select: { name: true } }, payments: { where: { status: "VALID" }, select: { amount: true } } }, orderBy: { dueDate: "asc" }, take: 50 });
    const [tasks, meetings, invoices, programs] = await Promise.all([
      prisma.task.findMany({ where: { ...taskScope(user.id, user.role), dueDate: { lt: now }, status: { notIn: ["DONE", "CANCELLED"] } }, include: { program: { select: { id: true, name: true, client: { select: { businessName: true } } } }, assignee: { select: { name: true } } }, orderBy: { dueDate: "asc" }, take: 50 }),
      prisma.meetingNote.findMany({ where: { program: programScope(user.id, user.role), meetingAt: { gte: now, lt: nextWeek } }, include: { client: { select: { businessName: true } }, program: { select: { id: true, name: true } } }, orderBy: { meetingAt: "asc" }, take: 50 }),
      invoicePromise,
      prisma.program.findMany({ where: { ...programScope(user.id, user.role), status: { in: ["ACTIVE", "ON_HOLD"] } }, include: { client: { select: { businessName: true } }, tasks: { select: { status: true, dueDate: true } } }, orderBy: [{ risk: "desc" }, { targetDate: "asc" }], take: 50 })
    ]);
    const overdueInvoices = invoices.map((invoice) => ({ ...invoice, balance: invoice.totalAmount - invoice.payments.reduce((sum, payment) => sum + payment.amount, 0) })).filter((invoice) => invoice.balance > 0);
    const healthPrograms = programs.map((program) => ({ id: program.id, name: program.name, clientName: program.client.businessName, risk: program.risk, healthScore: program.healthScore, riskNote: program.riskNote, targetDate: program.targetDate, overdueTaskCount: program.tasks.filter((task) => task.dueDate < now && !["DONE", "CANCELLED"].includes(task.status)).length })).filter((program) => program.risk !== "HEALTHY" || program.overdueTaskCount > 0);
    const payload = {
      generatedAt: now.toISOString(),
      overdueTasks: tasks.map((task) => ({ id: task.id, title: task.title, dueDate: task.dueDate, programId: task.program.id, programName: task.program.name, clientName: task.program.client.businessName, assigneeName: task.assignee.name })),
      upcomingMeetings: meetings,
      overdueInvoices,
      programHealth: healthPrograms,
      counts: { overdueTasks: tasks.length, upcomingMeetings: meetings.length, overdueInvoices: overdueInvoices.length, programHealth: healthPrograms.length }
    };
    return Response.json(payload, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}
