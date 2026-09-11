import { PrismaClient, ClientStatus, ProgramStatus, ServiceType, TaskPriority, TaskStatus, UserRole, RecordStatus, InvoiceStatus, PaymentMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const seedPassword = process.env.SEED_DEMO_PASSWORD;
  if (!seedPassword || seedPassword.length < 12) throw new Error("SEED_DEMO_PASSWORD wajib diisi dan minimal 12 karakter; seed tidak memakai password default.");
  const passwordHash = await bcrypt.hash(seedPassword, 12);
  await prisma.organizationSettings.upsert({
    where: { id: "organization" },
    update: { name: "Shaff Development", email: "hello@shaff.dev" },
    create: { id: "organization", name: "Shaff Development", email: "hello@shaff.dev", bankName: "Bank BCA", bankAccountName: "Shaff Development" }
  });

  const admin = await prisma.user.upsert({ where: { email: "admin@shaff.dev" }, update: { name: "Admin Shaff", jobTitle: "Administrator", passwordHash }, create: { name: "Admin Shaff", jobTitle: "Administrator", email: "admin@shaff.dev", passwordHash, role: UserRole.ADMIN } });
  const lead = await prisma.user.upsert({ where: { email: "lead@shaff.dev" }, update: { name: "Rizky Zaneva", jobTitle: "Lead Operasional", passwordHash }, create: { name: "Rizky Zaneva", jobTitle: "Lead Operasional", email: "lead@shaff.dev", passwordHash, role: UserRole.LEAD } });
  const member = await prisma.user.upsert({ where: { email: "member@shaff.dev" }, update: { name: "Alya Putri", jobTitle: "Pendamping", passwordHash }, create: { name: "Alya Putri", jobTitle: "Pendamping", email: "member@shaff.dev", passwordHash, role: UserRole.MEMBER } });
  const finance = await prisma.user.upsert({ where: { email: "finance@shaff.dev" }, update: { name: "Finance Shaff", jobTitle: "Finance", passwordHash }, create: { name: "Finance Shaff", jobTitle: "Finance", email: "finance@shaff.dev", passwordHash, role: UserRole.FINANCE } });

  const ceo = await prisma.user.upsert({ where: { email: "ceo@shaff.dev" }, update: { name: "CEO Shaff Development", jobTitle: "CEO", role: UserRole.ADMIN, passwordHash }, create: { name: "CEO Shaff Development", jobTitle: "CEO", email: "ceo@shaff.dev", passwordHash, role: UserRole.ADMIN } });
  const cmo = await prisma.user.upsert({ where: { email: "cmo@shaff.dev" }, update: { name: "CMO Shaff Development", jobTitle: "CMO", role: UserRole.LEAD, passwordHash }, create: { name: "CMO Shaff Development", jobTitle: "CMO", email: "cmo@shaff.dev", passwordHash, role: UserRole.LEAD } });
  const cto = await prisma.user.upsert({ where: { email: "cto@shaff.dev" }, update: { name: "CTO Shaff Development", jobTitle: "CTO", role: UserRole.MEMBER, passwordHash }, create: { name: "CTO Shaff Development", jobTitle: "CTO", email: "cto@shaff.dev", passwordHash, role: UserRole.MEMBER } });
  const cfo = await prisma.user.upsert({ where: { email: "cfo@shaff.dev" }, update: { name: "CFO Shaff Development", jobTitle: "CFO", role: UserRole.FINANCE, passwordHash }, create: { name: "CFO Shaff Development", jobTitle: "CFO", email: "cfo@shaff.dev", passwordHash, role: UserRole.FINANCE } });
  const coo = await prisma.user.upsert({ where: { email: "coo@shaff.dev" }, update: { name: "COO Shaff Development", jobTitle: "COO", role: UserRole.ADMIN, passwordHash }, create: { name: "COO Shaff Development", jobTitle: "COO", email: "coo@shaff.dev", passwordHash, role: UserRole.ADMIN } });

  const client = await prisma.client.upsert({ where: { id: "seed-client-kopi" }, update: { leadId: cmo.id }, create: { id: "seed-client-kopi", businessName: "Kopi Ruang Tengah", sector: "F&B", address: "Bandung", status: ClientStatus.ACTIVE, leadId: cmo.id, contacts: { create: { name: "Nadia Putri", title: "Owner", email: "nadia@kopiruang.test", phone: "08123456789", isPrimary: true } } } });
  const program = await prisma.program.upsert({ where: { id: "seed-program-kopi" }, update: {}, create: { id: "seed-program-kopi", clientId: client.id, name: "Digitalisasi Operasional", serviceType: ServiceType.COMBINED, objective: "Merapikan alur kerja dan pencatatan penjualan.", deliverables: "SOP operasional, dashboard penjualan", startDate: new Date("2026-09-01"), targetDate: new Date("2026-10-31"), status: ProgramStatus.ACTIVE } });
  await prisma.programMember.upsert({ where: { programId_userId: { programId: program.id, userId: lead.id } }, update: { isActive: true }, create: { programId: program.id, userId: lead.id } });
  await prisma.programMember.upsert({ where: { programId_userId: { programId: program.id, userId: member.id } }, update: { isActive: true }, create: { programId: program.id, userId: member.id } });
  await prisma.programMember.upsert({ where: { programId_userId: { programId: program.id, userId: cto.id } }, update: { isActive: true }, create: { programId: program.id, userId: cto.id } });
  await prisma.programMember.upsert({ where: { programId_userId: { programId: program.id, userId: cmo.id } }, update: { isActive: true }, create: { programId: program.id, userId: cmo.id } });

  await prisma.task.upsert({ where: { id: "seed-task-dashboard" }, update: {}, create: { id: "seed-task-dashboard", programId: program.id, assigneeId: member.id, title: "Review dashboard penjualan", description: "Pastikan data transaksi Agustus sudah masuk.", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, dueDate: new Date("2026-09-12") } });
  await prisma.task.upsert({ where: { id: "seed-task-sop" }, update: {}, create: { id: "seed-task-sop", programId: program.id, assigneeId: lead.id, title: "Review draft SOP kasir", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, dueDate: new Date("2026-09-15") } });

  const invoice = await prisma.invoice.upsert({ where: { id: "seed-invoice-kopi" }, update: { approvalStatus: "APPROVED" }, create: { id: "seed-invoice-kopi", clientId: client.id, programId: program.id, createdById: finance.id, invoiceNumber: "SD/2026/0001", issueDate: new Date("2026-09-01"), dueDate: new Date("2026-09-30"), status: InvoiceStatus.ISSUED, approvalStatus: "APPROVED", clientNameSnapshot: client.businessName, clientAddressSnapshot: client.address, organizationNameSnapshot: "Shaff Development", bankSnapshot: "Bank BCA — Shaff Development", totalAmount: 7500000, issuedAt: new Date("2026-09-01"), items: { create: { description: "Pendampingan dan digitalisasi sistem bisnis", quantity: 1, unitPrice: 7500000, amount: 7500000 } } } });
  await prisma.payment.upsert({ where: { id: "seed-payment-kopi" }, update: {}, create: { id: "seed-payment-kopi", invoiceId: invoice.id, recordedById: finance.id, paidAt: new Date("2026-09-05"), amount: 2500000, method: PaymentMethod.TRANSFER, reference: "TRX-DEMO-001" } });
  await prisma.auditLog.create({ data: { actorId: admin.id, action: "SEED_DATA_READY", objectType: "OrganizationSettings", objectId: "organization", changes: { source: "prisma/seed.ts" } } });
  console.log(`Seeded Shaff Development demo data for ${[admin, lead, member, finance, ceo, cmo, cto, cfo, coo].map((user) => user.email).join(", ")}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
