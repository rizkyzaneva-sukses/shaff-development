import { prisma } from "./prisma";
import { demoClients, demoMetrics, demoTasks } from "./mock-data";
import type { DashboardClient, DashboardMetrics, DashboardTask } from "./types";
import type { Prisma, UserRole } from "@prisma/client";
import { isExecutor } from "@/lib/roles";

/** Matches lib/utils.ts semantics (Asia/Jakarta). en-CA yields ISO YYYY-MM-DD. */
const DAY_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });
const jakartaDayKey = (value: Date) => DAY_KEY_FORMAT.format(value);

/** Instant of 00:00 Asia/Jakarta (UTC+7, no DST) for the day containing `value`. */
function jakartaDayStart(value: Date): Date {
  const key = jakartaDayKey(value);
  return new Date(`${key}T00:00:00.000+07:00`);
}

/** Last inclusive day of the Jakarta week containing `value` (WIB is UTC+7, so 06:00 matches midnight). */
function jakartaWeekEndStart(value: Date): Date {
  const weekday = new Date(`${jakartaDayKey(value)}T06:00:00.000Z`).getUTCDay();
  const end = jakartaDayStart(value);
  end.setUTCDate(end.getUTCDate() + ((7 - weekday) % 7));
  return end;
}

/**
 * Read-only dashboard data. The mock fallback makes local UI work without a
 * running PostgreSQL instance; production callers should provide a database.
 */
export async function getDashboardData(scopeUser?: { id: string; role: UserRole }): Promise<{
  metrics: DashboardMetrics;
  clients: DashboardClient[];
  tasks: DashboardTask[];
}> {
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL wajib diisi di production");
    return { metrics: demoMetrics, clients: demoClients, tasks: demoTasks };
  }

  try {
    if (scopeUser?.role === "FINANCE") {
      const invoices = await prisma.invoice.findMany({
        where: { status: "ISSUED" },
        select: { totalAmount: true, payments: { where: { status: "VALID" }, select: { amount: true } } },
      });
      const receivables = invoices.reduce((sum, invoice) => sum + invoice.totalAmount - invoice.payments.reduce((paid, payment) => paid + payment.amount, 0), 0);
      return { metrics: { activeClients: 0, activePrograms: 0, overdueTasks: 0, dueThisWeek: 0, receivables }, clients: [], tasks: [] };
    }
    const allData = !scopeUser || scopeUser.role === "ADMIN";
    const clientWhere = allData ? {} : scopeUser.role === "LEAD" ? { leadId: scopeUser.id } : { programs: { some: { members: { some: { userId: scopeUser.id, isActive: true } } } } };
    const programWhere = allData ? {} : scopeUser.role === "LEAD" ? { client: { leadId: scopeUser.id } } : { members: { some: { userId: scopeUser.id, isActive: true } } };
    const taskWhere = allData ? { status: { not: "CANCELLED" as const } } : scopeUser.role === "LEAD" ? { status: { not: "CANCELLED" as const }, program: { client: { leadId: scopeUser.id } } } : { status: { not: "CANCELLED" as const }, assigneeId: scopeUser.id };
    const invoiceWhere = isExecutor(scopeUser?.role)
      ? { id: "__member_invoice_access_denied__" }
      : { ...(allData ? {} : scopeUser?.role === "LEAD" ? { client: { leadId: scopeUser.id } } : { program: { members: { some: { userId: scopeUser?.id, isActive: true } } } }), status: "ISSUED" as const };
    const [clients, clientCount, programs, tasks, invoices] = await Promise.all([
      prisma.client.findMany({
        where: { ...clientWhere, status: "ACTIVE" },
        include: {
          programs: {
            where: {
              status: { in: ["ACTIVE", "ON_HOLD"] },
              ...(scopeUser && isExecutor(scopeUser.role) ? { members: { some: { userId: scopeUser.id, isActive: true } } } : {})
            },
            take: 1,
            include: { tasks: { select: { status: true } } }
          }
        },
        orderBy: { updatedAt: "desc" },
        take: 100
      }),
      // Real active-client count — the list above is capped at 100 for payload size, the count is not.
      prisma.client.count({ where: { ...clientWhere, status: "ACTIVE" } }),
      prisma.program.findMany({ where: { ...programWhere, status: { in: ["ACTIVE", "ON_HOLD"] } }, include: { tasks: { select: { status: true } } } }),
      prisma.task.findMany({ where: taskWhere, include: { program: { include: { client: true } }, assignee: true }, orderBy: { dueDate: "asc" }, take: 20 }),
      prisma.invoice.findMany({ where: invoiceWhere, select: { totalAmount: true, payments: { where: { status: "VALID" }, select: { amount: true } } } })
    ]);

    // Dashboard task counts are real aggregates; the task list above stays truncated (take: 20) for payload size.
    // Day boundaries follow Asia/Jakarta to match lib/utils.ts, so a task due today is "due this week", not overdue.
    const todayStart = jakartaDayStart(new Date());
    const weekEndStart = jakartaWeekEndStart(new Date());
    const openTaskWhere = { status: { notIn: ["DONE", "CANCELLED"] } } satisfies Prisma.TaskWhereInput;
    const [overdueCount, dueThisWeekCount] = await Promise.all([
      prisma.task.count({ where: { ...taskWhere, ...openTaskWhere, dueDate: { lt: todayStart } } }),
      prisma.task.count({ where: { ...taskWhere, ...openTaskWhere, dueDate: { gte: todayStart, lte: weekEndStart } } })
    ]);

    const mappedClients = clients.map((client) => {
      const program = client.programs[0];
      const programTasks = program?.tasks ?? [];
      const progress = programTasks.length > 0
        ? Math.round((programTasks.filter((t) => t.status === "DONE").length / programTasks.length) * 100)
        : null;
      return {
        id: client.id,
        businessName: client.businessName,
        sector: client.sector ?? "Umum",
        programName: program?.name ?? "Belum ada program",
        progress,
        status: "ACTIVE" as const,
        nextAction: "Buka detail client"
      };
    });
    const mappedTasks = tasks.map((task) => ({ id: task.id, title: task.title, clientName: task.program.client.businessName, programName: task.program.name, status: task.status, priority: task.priority, dueDate: task.dueDate.toISOString(), assigneeName: task.assignee.name }));
    const receivables = invoices.reduce((sum, invoice) => sum + invoice.totalAmount - invoice.payments.reduce((paid, payment) => paid + payment.amount, 0), 0);
    return { metrics: { activeClients: clientCount, activePrograms: programs.length, overdueTasks: overdueCount, dueThisWeek: dueThisWeekCount, receivables }, clients: mappedClients, tasks: mappedTasks };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    return { metrics: demoMetrics, clients: demoClients, tasks: demoTasks };
  }
}
