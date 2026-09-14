import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";

function clientScope(userId: string, role: string) {
  if (role === "ADMIN" || role === "FINANCE") return {};
  if (role === "LEAD") return { leadId: userId };
  return { programs: { some: { members: { some: { userId, isActive: true } } } } };
}

export async function GET() {
  try {
    const user = await requireUser(["ADMIN", "LEAD", "MEMBER"]);
    const clients = await prisma.client.findMany({ where: clientScope(user.id, user.role), include: { contacts: true, programs: { where: user.role === "MEMBER" ? { members: { some: { userId: user.id, isActive: true } } } : undefined, select: { id: true, name: true, status: true, targetDate: true } } }, orderBy: { updatedAt: "desc" } });
    return Response.json({ clients });
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(["ADMIN"]);
    const body = await request.json().catch(() => ({}));
    const businessName = typeof body.businessName === "string" ? body.businessName.trim() : "";
    const contact = body.contact && typeof body.contact === "object" ? body.contact : null;
    if (!businessName || businessName.length > 160) return Response.json({ error: "Nama usaha wajib diisi dan maksimal 160 karakter" }, { status: 400 });
    if (!contact || typeof contact.name !== "string" || !contact.name.trim()) return Response.json({ error: "Kontak utama wajib diisi" }, { status: 400 });
    const leadId = typeof body.leadId === "string" ? body.leadId : null;
    if (leadId) {
      const lead = await prisma.user.findFirst({ where: { id: leadId, role: "LEAD", status: "ACTIVE" } });
      if (!lead) return Response.json({ error: "Lead tidak valid" }, { status: 400 });
    }
    const client = await prisma.$transaction(async (tx) => {
      const created = await tx.client.create({ data: { businessName, sector: typeof body.sector === "string" ? body.sector.trim().slice(0, 120) : null, address: typeof body.address === "string" ? body.address.trim().slice(0, 300) : null, notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : null, leadId, contacts: { create: { name: contact.name.trim().slice(0, 160), title: typeof contact.title === "string" ? contact.title.trim().slice(0, 120) : null, email: typeof contact.email === "string" ? contact.email.trim().toLowerCase().slice(0, 160) : null, phone: typeof contact.phone === "string" ? contact.phone.trim().slice(0, 40) : null, isPrimary: true } } }, include: { contacts: true } });
      await tx.auditLog.create({ data: { actorId: user.id, action: "CLIENT_CREATED", objectType: "Client", objectId: created.id, changes: { businessName, leadId } } });
      return created;
    });
    return Response.json({ client }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
