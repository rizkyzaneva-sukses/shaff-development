import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser(["ADMIN"]);
    const users = await prisma.user.findMany({ orderBy: [{ status: "asc" }, { name: "asc" }], select: { id: true, name: true, jobTitle: true, email: true, role: true, status: true, lastLoginAt: true, createdAt: true } });
    return Response.json({ users });
  } catch (error) {
    return jsonError(error);
  }
}
