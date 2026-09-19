import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";
import type { ExpenseCategory, Prisma } from "@prisma/client";

const validCategories = ["GAJI", "SEWA", "TOOLS_SOFTWARE", "TRANSPORT", "OPERASIONAL", "MARKETING", "LAINNYA"];
const DEFAULT_LIMIT = 500;
const MIN_EXPENSE_DATE = new Date("2000-01-01T00:00:00.000Z");

/** Read-only expense list, bounded by default (no pagination UI yet) with optional category/date filters. */
export async function GET(request: Request) {
  try {
    // Every internal role may read expenses (read-only visibility for operations),
    // but only ADMIN and FINANCE may create or change money records.
    await requireUser(["ADMIN", "LEAD", "MEMBER", "FINANCE"]);
    const searchParams = new URL(request.url).searchParams;
    const category = searchParams.get("category");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (category && !validCategories.includes(category)) return Response.json({ error: "Kategori tidak valid" }, { status: 400 });
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    if (from && (!fromDate || Number.isNaN(fromDate.getTime()))) return Response.json({ error: "Tanggal awal tidak valid" }, { status: 400 });
    if (to && (!toDate || Number.isNaN(toDate.getTime()))) return Response.json({ error: "Tanggal akhir tidak valid" }, { status: 400 });
    if (fromDate && toDate && fromDate > toDate) return Response.json({ error: "Rentang tanggal tidak valid" }, { status: 400 });

    const where: Prisma.ExpenseWhereInput = {
      ...(category ? { category: category as ExpenseCategory } : {}),
      ...(fromDate || toDate ? { expenseDate: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } } : {})
    };
    const expenses = await prisma.expense.findMany({
      where,
      include: { createdBy: { select: { id: true, name: true, email: true } } },
      orderBy: { expenseDate: "desc" },
      take: DEFAULT_LIMIT
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

    if (!validCategories.includes(category)) return Response.json({ error: "Kategori tidak valid" }, { status: 400 });
    if (!description || description.length > 300) return Response.json({ error: "Deskripsi wajib diisi (max 300 karakter)" }, { status: 400 });
    if (!Number.isSafeInteger(amount) || amount < 1) return Response.json({ error: "Nominal harus bilangan bulat minimal 1" }, { status: 400 });
    if (Number.isNaN(expenseDate.getTime())) return Response.json({ error: "Tanggal tidak valid" }, { status: 400 });
    if (expenseDate.getTime() > Date.now() + 24 * 60 * 60_000) return Response.json({ error: "Tanggal pengeluaran tidak boleh lebih dari 1 hari ke depan" }, { status: 400 });
    if (expenseDate < MIN_EXPENSE_DATE) return Response.json({ error: "Tanggal pengeluaran tidak boleh sebelum 1 Januari 2000" }, { status: 400 });

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
