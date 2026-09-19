import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireUser(["ADMIN", "LEAD", "CMO", "COO"]);
    const whereScope =
      user.role === "ADMIN" || user.role === "FINANCE"
        ? {}
        : user.role === "LEAD"
        ? { client: { leadId: user.id } }
        : { members: { some: { userId: user.id, isActive: true } } };

    const program = await prisma.program.findFirst({
      where: { id, ...whereScope },
      include: {
        client: true,
        members: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
        },
        tasks: {
          include: {
            assignee: { select: { name: true } },
          },
          orderBy: { dueDate: "asc" },
        },
      },
    });

    if (!program) {
      return Response.json({ error: "Program tidak ditemukan atau di luar akses" }, { status: 404 });
    }

    return Response.json({ program });
  } catch (error) {
    return jsonError(error);
  }
}
