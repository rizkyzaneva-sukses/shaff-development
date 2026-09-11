import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";

function csvCell(value: unknown) { let text = value == null ? "" : String(value); if (/^[=+\-@]/.test(text)) text = `'${text}`; return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function csv(rows: unknown[][]) { return rows.map((row) => row.map(csvCell).join(",")).join("\r\n"); }
function excelCell(value: unknown) { let text = String(value == null ? "" : value); if (/^[=+\-@]/.test(text)) text = `'${text}`; return `<td>${text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")}</td>`; }
function exportResponse(request: Request, rows: unknown[][], filename: string) { const format = new URL(request.url).searchParams.get("format"); if (format === "excel") { const table = `<html><head><meta charset="utf-8"></head><body><table>${rows.map((row, index) => `<tr>${row.map((value) => index === 0 ? `<th>${String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</th>` : excelCell(value)).join("")}</tr>`).join("")}</table></body></html>`; return new Response(`\uFEFF${table}`, { headers: { "content-type": "application/vnd.ms-excel; charset=utf-8", "content-disposition": `attachment; filename="${filename.replace(/\.csv$/, ".xls")}"`, "cache-control": "private, no-store" } }); } return new Response(`\uFEFF${csv(rows)}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${filename}"`, "cache-control": "private, no-store" } }); }

export async function GET(request: Request) {
  try {
    const user = await requireUser(); const resource = new URL(request.url).searchParams.get("resource") ?? "clients"; const all = user.role === "ADMIN" || user.role === "FINANCE";
    if (resource === "clients") {
      const where = all ? {} : user.role === "LEAD" ? { leadId: user.id } : { programs: { some: { members: { some: { userId: user.id, isActive: true } } } } };
      const clients = await prisma.client.findMany({ where, include: { lead: { select: { name: true } }, contacts: { where: { isPrimary: true }, take: 1 }, programs: { select: { name: true, status: true } } }, orderBy: { updatedAt: "desc" } });
      const rows = [["ID", "Nama usaha", "Status", "Lead", "Kontak utama", "Program"], ...clients.map((client) => [client.id, client.businessName, client.status, client.lead?.name ?? "", client.contacts[0]?.name ?? "", client.programs.map((program) => `${program.name} (${program.status})`).join(" | ")])];
      return exportResponse(request, rows, "shaff-clients.csv");
    }
    if (resource === "tasks") {
      const where = all ? {} : user.role === "LEAD" ? { program: { client: { leadId: user.id } } } : { assigneeId: user.id };
      const tasks = await prisma.task.findMany({ where, include: { program: { include: { client: true } }, assignee: { select: { name: true } } }, orderBy: { dueDate: "asc" } });
      const rows = [["ID", "Task", "Client", "Program", "Status", "Prioritas", "Deadline", "Assignee"], ...tasks.map((task) => [task.id, task.title, task.program.client.businessName, task.program.name, task.status, task.priority, task.dueDate.toISOString(), task.assignee.name])];
      return exportResponse(request, rows, "shaff-tasks.csv");
    }
    if (resource === "invoices") {
      if (user.role === "MEMBER") return Response.json({ error: "Akses invoice tidak diizinkan" }, { status: 403 });
      const where = all ? {} : user.role === "LEAD" ? { client: { leadId: user.id } } : { program: { members: { some: { userId: user.id, isActive: true } } } };
      const invoices = await prisma.invoice.findMany({ where, include: { client: { select: { businessName: true } }, program: { select: { name: true } }, payments: { where: { status: "VALID" }, select: { amount: true } } }, orderBy: { dueDate: "asc" } });
      const rows = [["ID", "Nomor", "Client", "Program", "Status", "Total", "Terbayar", "Saldo", "Jatuh tempo"], ...invoices.map((invoice) => { const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0); return [invoice.id, invoice.invoiceNumber ?? "", invoice.client.businessName, invoice.program.name, invoice.status, invoice.totalAmount, paid, invoice.totalAmount - paid, invoice.dueDate.toISOString()]; })];
      return exportResponse(request, rows, "shaff-invoices.csv");
    }
    return Response.json({ error: "Resource export tidak dikenal" }, { status: 400 });
  } catch (error) { return jsonError(error); }
}
