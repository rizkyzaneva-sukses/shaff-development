import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!process.env.DATABASE_URL) return Response.json({ status: process.env.NODE_ENV === "production" ? "degraded" : "ok", database: "not-configured" }, { status: process.env.NODE_ENV === "production" ? 503 : 200, headers: { "cache-control": "no-store" } });
  try { await prisma.$queryRaw`SELECT 1`; return Response.json({ status: "ok", database: "ok" }, { headers: { "cache-control": "no-store" } }); } catch { return Response.json({ status: "degraded", database: "unavailable" }, { status: 503, headers: { "cache-control": "no-store" } }); }
}
