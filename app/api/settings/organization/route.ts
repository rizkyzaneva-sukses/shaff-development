import { prisma } from "@/lib/prisma";
import { assertSameOrigin, jsonError, requireUser } from "@/lib/auth";

const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) || null : null;

export async function GET() {
  try {
    await requireUser();
    const settings = await prisma.organizationSettings.findUnique({ where: { id: "organization" } });
    return Response.json({ settings });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(["ADMIN"]);
    const body = await request.json().catch(() => ({}));
    const name = text(body.name, 160);
    if (!name) return Response.json({ error: "Nama organisasi wajib diisi" }, { status: 400 });
    const data = {
      name,
      legalName: text(body.legalName, 200),
      address: text(body.address, 500),
      phone: text(body.phone, 60),
      email: text(body.email, 160),
      logoUrl: text(body.logoUrl, 500),
      bankName: text(body.bankName, 160),
      bankAccountName: text(body.bankAccountName, 160),
      bankAccountNo: text(body.bankAccountNo, 80)
    };
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) return Response.json({ error: "Email organisasi tidak valid" }, { status: 400 });
    const settings = await prisma.$transaction(async (tx) => {
      const previous = await tx.organizationSettings.findUnique({ where: { id: "organization" } });
      const updated = await tx.organizationSettings.upsert({ where: { id: "organization" }, update: data, create: { id: "organization", ...data, name } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "ORGANIZATION_SETTINGS_UPDATED", objectType: "OrganizationSettings", objectId: "organization", changes: { before: previous ? { name: previous.name, legalName: previous.legalName, address: previous.address, phone: previous.phone, email: previous.email, bankName: previous.bankName, bankAccountName: previous.bankAccountName, bankAccountNo: previous.bankAccountNo } : null, after: data } } });
      return updated;
    });
    return Response.json({ settings });
  } catch (error) {
    return jsonError(error);
  }
}
