import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";

function scopeFor(userId: string, role: string) {
  if (role === "ADMIN" || role === "FINANCE") return {};
  if (role === "LEAD") return { client: { leadId: userId } };
  return { members: { some: { userId, isActive: true } } };
}

function csvCell(value: unknown) {
  let text = String(value ?? ""); if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
function excelCell(value: unknown) { let text = String(value ?? ""); if (/^[=+\-@]/.test(text)) text = `'${text}`; return `<td>${text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")}</td>`; }

export async function GET(request: Request) {
  try {
    const user = await requireUser(["ADMIN", "LEAD", "CMO", "COO"]);
    const programs = await prisma.program.findMany({ where: { ...scopeFor(user.id, user.role), status: { in: ["ACTIVE", "ON_HOLD"] } }, include: { client: { select: { businessName: true } }, tasks: { select: { status: true, dueDate: true } } }, orderBy: { targetDate: "asc" } });
    const now = new Date();
    const rows = [
      ["Program", "Client", "Status", "Risk", "Health score", "Risk note", "Target", "Overdue tasks"],
      ...programs.map((program) => [program.name, program.client.businessName, program.status, program.risk, program.healthScore ?? "", program.riskNote ?? "", program.targetDate.toISOString().slice(0, 10), program.tasks.filter((task) => task.dueDate < now && !["DONE", "CANCELLED"].includes(task.status)).length])
    ];
    const stamp = new Date().toISOString().slice(0, 10); const format = new URL(request.url).searchParams.get("format");
    if (format === "excel") { const table = `<html><head><meta charset="utf-8"></head><body><table>${rows.map((row, index) => `<tr>${row.map((value) => index === 0 ? `<th>${String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</th>` : excelCell(value)).join("")}</tr>`).join("")}</table></body></html>`; return new Response(`\uFEFF${table}`, { headers: { "content-type": "application/vnd.ms-excel; charset=utf-8", "content-disposition": `attachment; filename="shaff-program-health-${stamp}.xls"`, "cache-control": "private, no-store" } }); }
    return new Response(`\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="shaff-program-health-${stamp}.csv"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return jsonError(error);
  }
}
