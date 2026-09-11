import { getDashboardData } from "@/lib/data";
import { jsonError, requireUser } from "@/lib/auth";

export async function GET() {
  try { const user = await requireUser(); const dashboard = await getDashboardData({ id: user.id, role: user.role }); return Response.json(dashboard, { headers: { "cache-control": "private, no-store" } }); } catch (error) { return jsonError(error); }
}
