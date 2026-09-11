import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";

const maxPageSize = 50;

export async function GET(request: Request) {
  try {
    await requireUser(["ADMIN"]);
    const url = new URL(request.url);
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(maxPageSize, Math.max(1, Number.parseInt(url.searchParams.get("pageSize") || "20", 10) || 20));
    const action = url.searchParams.get("action")?.trim().slice(0, 80);
    const objectType = url.searchParams.get("objectType")?.trim().slice(0, 80);
    const actorId = url.searchParams.get("actorId")?.trim().slice(0, 80);
    const q = url.searchParams.get("q")?.trim().slice(0, 120);
    const fromRaw = url.searchParams.get("from");
    const toRaw = url.searchParams.get("to");
    const from = fromRaw ? new Date(`${fromRaw}T00:00:00.000Z`) : null;
    const to = toRaw ? new Date(`${toRaw}T23:59:59.999Z`) : null;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) return Response.json({ error: "Rentang tanggal tidak valid" }, { status: 400 });
    const where = {
      ...(action ? { action: { contains: action, mode: "insensitive" as const } } : {}),
      ...(objectType ? { objectType: { contains: objectType, mode: "insensitive" as const } } : {}),
      ...(actorId ? { actorId } : {}),
      ...(q ? { OR: [{ action: { contains: q, mode: "insensitive" as const } }, { objectType: { contains: q, mode: "insensitive" as const } }, { objectId: { contains: q, mode: "insensitive" as const } }] } : {}),
      ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {})
    };
    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({ where, include: { actor: { select: { id: true, name: true, jobTitle: true, email: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.auditLog.count({ where })
    ]);
    return Response.json({ logs, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
  } catch (error) {
    return jsonError(error);
  }
}
