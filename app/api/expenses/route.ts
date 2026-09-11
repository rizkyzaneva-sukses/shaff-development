import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser(["ADMIN", "FINANCE"]);
    const expenses = await prisma.expense.findMany({
      include: { createdBy: { select: { id: true, name: true, email: true } } },
      orderBy: { expenseDate: "desc" }
    });
    return Response.json({ expenses });
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN", "FINANCE"]);
    const body = await request.json().catch(() => ({}));
    const category = body.category;
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const amount = Number(body.amount);
    const expenseDate = new Date(body.expenseDate);
    const notes = typeof body.notes === "string" ? body.notes.trim() : null;

    const validCategories = ["GAJI", "SEWA", "TOOLS_SOFTWARE", "TRANSPORT", "OPERASIONAL", "MARKETING", "LAINNYA"];
    if (!validCategories.includes(category)) return Response.json({ error: "Kategori tidak valid" }, { status: 400 });
    if (!description || description.length > 300) return Response.json({ error: "Deskripsi wajib diisi (max 300 karakter)" }, { status: 400 });
    if (!amount || amount < 1) return Response.json({ error: "Nominal harus lebih dari 0" }, { status: 400 });
    if (Number.isNaN(expenseDate.getTime())) return Response.json({ error: "Tanggal tidak valid" }, { status: 400 });

    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: { category, description, amount, expenseDate, notes, createdById: user.id },
        include: { createdBy: { select: { id: true, name: true, email: true } } }
      });
      await tx.auditLog.create({ data: { actorId: user.id, action: "EXPENSE_CREATED", objectType: "Expense", objectId: created.id, changes: { category, description, amount } } });
      return created;
    });
    return Response.json({ expense }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
