/**
 * Seed 3 studi kasus latihan untuk shaff-app.
 * Idempoten: pakai id tetap + upsert, jadi aman dijalankan berulang.
 *
 * Skenario:
 *   KASUS-1  Prospek baru (PROSPECT) — tim melatih: input → aktifkan → buat program
 *   KASUS-2  Client aktif dengan program berjalan — tim melatih: task, meeting, dokumen, invoice, bayar
 *   KASUS-3  Program macet (ON_HOLD) + client PROSPECT kedua — tim melatih: eskALASI & penanganan kendala
 */
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const ID = {
  c1: "kasus1-client", p1: "kasus1-program",
  c2: "kasus2-client", p2: "kasus2-program",
  c3: "kasus3-client", p3: "kasus3-program",
};

async function main() {
  const users = await p.user.findMany({ select: { id: true, email: true, role: true } });
  const by = (email) => users.find((u) => u.email === email)?.id;
  const admin = by("admin@shaff.dev");
  const lead = by("lead@shaff.dev");
  const cmo = by("cmo@shaff.dev");
  const coo = by("member@shaff.dev");
  const finance = by("finance@shaff.dev");
  if (!admin || !lead || !cmo || !coo || !finance) throw new Error("user tidak lengkap");

  const days = (n) => new Date(Date.now() + n * 86400000);

  // ── KASUS-1: prospek baru, belum ada program ──────────────────────────────
  await p.client.upsert({
    where: { id: ID.c1 },
    update: { status: "PROSPECT" },
    create: {
      id: ID.c1,
      businessName: "KASUS-1 Kedai Kopi Merdeka",
      sector: "F&B",
      address: "Jl. Merdeka No. 12, Bandung",
      notes: "LATIHAN: prospek baru dari pameran UMKM. Belum deal, belum ada program.",
      status: "PROSPECT",
      contacts: { create: { name: "Pak Hendra", title: "Pemilik", email: "hendra@kasus1.test", phone: "081200000001", isPrimary: true } },
    },
  });

  // ── KASUS-2: client aktif, program berjalan lengkap ───────────────────────
  await p.client.upsert({
    where: { id: ID.c2 },
    update: { status: "ACTIVE", leadId: lead },
    create: {
      id: ID.c2,
      businessName: "KASUS-2 Konveksi Berkah Jaya",
      sector: "Manufaktur / Garmen",
      address: "Jl. Industri Raya No. 88, Cimahi",
      notes: "LATIHAN: client aktif. Program berjalan — task, meeting, dokumen, invoice sudah ada.",
      status: "ACTIVE",
      leadId: lead,
      contacts: { create: { name: "Bu Sari", title: "Direktur Operasional", email: "sari@kasus2.test", phone: "081200000002", isPrimary: true } },
    },
  });

  const prog2 = await p.program.upsert({
    where: { id: ID.p2 },
    update: {},
    create: {
      id: ID.p2,
      clientId: ID.c2,
      name: "Digitalisasi Produksi & Keuangan",
      serviceType: "COMBINED",
      objective: "Merapikan alur produksi, mencatat HPP per unit, dan menyusun laporan keuangan bulanan.",
      deliverables: "SOP Produksi, Kartu HPP per SKU, Dashboard penjualan, Laporan laba-rugi bulanan",
      startDate: days(-30), targetDate: days(30),
      status: "ACTIVE", healthScore: 78, risk: "HEALTHY",
      members: { create: [{ userId: lead }, { userId: cmo }, { userId: coo }] },
    },
  });

  // Task KASUS-2: satu selesai, satu jalan, satu macet (untuk latihan alasan BLOCKED)
  for (const t of [
    { id: "kasus2-task-1", title: "Wawancara alur produksi & catat waktu per tahap", status: "DONE", priority: "HIGH", due: days(-20), assignee: coo, note: "Selesai. 7 tahap produksi teridentifikasi." },
    { id: "kasus2-task-2", title: "Susun kartu HPP per SKU", status: "IN_PROGRESS", priority: "HIGH", due: days(3), assignee: cmo, note: null },
    { id: "kasus2-task-3", title: "Kumpulkan nota bahan baku 3 bulan terakhir", status: "BLOCKED", priority: "URGENT", due: days(-2), assignee: coo, note: "Nota belum diserahkan bagian gudang." },
    { id: "kasus2-task-4", title: "Susun draft SOP produksi", status: "TODO", priority: "MEDIUM", due: days(10), assignee: cmo, note: null },
  ]) {
    await p.task.upsert({
      where: { id: t.id }, update: {},
      create: { id: t.id, programId: prog2.id, assigneeId: t.assignee, title: t.title, status: t.status, priority: t.priority, dueDate: t.due, blockedReason: t.note, description: "LATIHAN KASUS-2" },
    });
  }

  // Meeting KASUS-2: satu sudah FINAL, satu masih DRAFT (untuk latihan finalisasi)
  await p.meetingNote.upsert({
    where: { id: "kasus2-meeting-1" }, update: {},
    create: {
      id: "kasus2-meeting-1", programId: prog2.id, clientId: ID.c2, creatorId: coo,
      title: "Kickoff pendampingan", meetingAt: days(-28), status: "FINAL",
      summary: "Pemetaan awal kondisi produksi dan penetapan target 2 bulan.",
      decisions: "Target: HPP per SKU tersedia sebelum akhir bulan depan.",
      actionItems: { create: [{ description: "Kirim daftar SKU prioritas" }] },
    },
  });
  await p.meetingNote.upsert({
    where: { id: "kasus2-meeting-2" }, update: {},
    create: {
      id: "kasus2-meeting-2", programId: prog2.id, clientId: ID.c2, creatorId: coo,
      title: "Review mingguan progres HPP", meetingAt: days(-1), status: "DRAFT",
      summary: null, decisions: null,
      actionItems: { create: [{ description: "Minta nota bahan baku dari gudang" }] },
    },
  });

  // Invoice KASUS-2: satu ISSUED belum dibayar, satu draft
  await p.invoice.upsert({
    where: { id: "kasus2-invoice-1" }, update: {},
    create: {
      id: "kasus2-invoice-1", invoiceNumber: "LATIHAN/K2/0001", clientId: ID.c2, programId: prog2.id, createdById: finance,
      issueDate: days(-20), dueDate: days(10), status: "ISSUED", approvalStatus: "APPROVED",
      clientNameSnapshot: "KASUS-2 Konveksi Berkah Jaya", clientAddressSnapshot: "Jl. Industri Raya No. 88, Cimahi",
      organizationNameSnapshot: "Shaff Development", bankSnapshot: "Bank BCA — Shaff Development",
      totalAmount: 7500000, issuedAt: days(-20),
      items: { create: [{ description: "Pendampingan bulan 1", quantity: 1, unitPrice: 5000000, amount: 5000000 }, { description: "Digitalisasi dashboard", quantity: 1, unitPrice: 2500000, amount: 2500000 }] },
    },
  });
  await p.invoice.upsert({
    where: { id: "kasus2-invoice-2" }, update: {},
    create: {
      id: "kasus2-invoice-2", invoiceNumber: "LATIHAN/K2/0002", clientId: ID.c2, programId: prog2.id, createdById: finance,
      issueDate: days(-3), dueDate: days(27), status: "DRAFT", approvalStatus: "PENDING",
      clientNameSnapshot: "KASUS-2 Konveksi Berkah Jaya", clientAddressSnapshot: "Jl. Industri Raya No. 88, Cimahi",
      organizationNameSnapshot: "Shaff Development", bankSnapshot: "Bank BCA — Shaff Development",
      totalAmount: 5000000,
      items: { create: [{ description: "Pendampingan bulan 2", quantity: 1, unitPrice: 5000000, amount: 5000000 }] },
    },
  });

  // ── KASUS-3: program ON_HOLD + client prospek kedua ───────────────────────
  await p.client.upsert({
    where: { id: ID.c3 },
    update: { status: "ACTIVE", leadId: lead },
    create: {
      id: ID.c3,
      businessName: "KASUS-3 Toko Bangunan Sumber Rejeki",
      sector: "Retail / Bangunan",
      address: "Jl. Raya Sawangan No. 5, Depok",
      notes: "LATIHAN: program sedang ditahan (ON_HOLD) karena client belum menyerahkan data.",
      status: "ACTIVE", leadId: lead,
      contacts: { create: { name: "Pak Anton", title: "Pemilik", email: "anton@kasus3.test", phone: "081200000003", isPrimary: true } },
    },
  });

  const prog3 = await p.program.upsert({
    where: { id: ID.p3 }, update: {},
    create: {
      id: ID.p3, clientId: ID.c3,
      name: "Perapian Pembukuan & Stok Gudang",
      serviceType: "SYSTEM_DIGITALIZATION",
      objective: "Memisahkan kas pribadi dan usaha, serta menata pencatatan stok masuk-keluar.",
      deliverables: "Template kas harian, Kartu stok gudang, SOP penerimaan barang",
      startDate: days(-45), targetDate: days(15),
      status: "ON_HOLD", healthScore: 45, risk: "ATTENTION",
      riskNote: "DITAHAN: client belum menyerahkan mutasi rekening dan data stok awal.",
      members: { create: [{ userId: lead }, { userId: cmo }] },
    },
  });

  for (const t of [
    { id: "kasus3-task-1", title: "Minta mutasi rekening 6 bulan", status: "BLOCKED", priority: "URGENT", due: days(-30), assignee: cmo, note: "Sudah 3x ditagih, belum dikirim. Perlu eskalasi ke Lead." },
    { id: "kasus3-task-2", title: "Susun template kas harian", status: "TODO", priority: "MEDIUM", due: days(7), assignee: cmo, note: null },
  ]) {
    await p.task.upsert({
      where: { id: t.id }, update: {},
      create: { id: t.id, programId: prog3.id, assigneeId: t.assignee, title: t.title, status: t.status, priority: t.priority, dueDate: t.due, blockedReason: t.note, description: "LATIHAN KASUS-3" },
    });
  }

  await p.meetingNote.upsert({
    where: { id: "kasus3-meeting-1" }, update: {},
    create: {
      id: "kasus3-meeting-1", programId: prog3.id, clientId: ID.c3, creatorId: lead,
      title: "Rapat penanganan program tertahan", meetingAt: days(-10), status: "DRAFT",
      summary: "Program ditahan karena data client belum lengkap. Perlu keputusan lanjut atau tutup.",
      decisions: null,
      actionItems: { create: [{ description: "Eskalasi ke CEO: keputusan lanjut atau tutup program" }] },
    },
  });

  // Biaya operasional (untuk latihan membaca laporan keuangan)
  for (const e of [
    { id: "kasus2-expense-1", category: "TRANSPORT", desc: "LATIHAN KASUS-2: kunjungan lokasi Cimahi", amount: 350000, date: days(-22), by: coo },
    { id: "kasus3-expense-1", category: "OPERASIONAL", desc: "LATIHAN KASUS-3: cetak template stok", amount: 120000, date: days(-12), by: cmo },
  ]) {
    await p.expense.upsert({
      where: { id: e.id }, update: {},
      create: { id: e.id, category: e.category, description: e.desc, amount: e.amount, expenseDate: e.date, createdById: e.by, notes: "Data latihan" },
    });
  }

  const counts = {
    client: await p.client.count({ where: { id: { in: [ID.c1, ID.c2, ID.c3] } } }),
    program: await p.program.count({ where: { id: { in: [ID.p1, ID.p2, ID.p3] } } }),
    task: await p.task.count({ where: { id: { startsWith: "kasus" } } }),
    meeting: await p.meetingNote.count({ where: { id: { startsWith: "kasus" } } }),
    invoice: await p.invoice.count({ where: { id: { startsWith: "kasus" } } }),
    expense: await p.expense.count({ where: { id: { startsWith: "kasus" } } }),
  };
  console.log("SELESAI:", JSON.stringify(counts));

  const clients = await p.client.findMany({ where: { id: { in: [ID.c1, ID.c2, ID.c3] } }, select: { businessName: true, status: true, _count: { select: { programs: true } } } });
  clients.forEach((c) => console.log("  ", c.businessName, "|", c.status, "|", c._count.programs, "program"));
}

main().catch((e) => { console.error("ERR:", String(e.message).slice(0, 400)); process.exit(1); }).finally(() => p.$disconnect());
