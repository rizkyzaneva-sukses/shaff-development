import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import {
  UserRole,
  ClientStatus,
  ProgramStatus,
  ServiceType,
  TaskStatus,
  TaskPriority,
  InvoiceStatus,
  ApprovalStatus,
  PaymentMethod,
  PaymentStatus,
  MeetingStatus,
  ExpenseCategory,
} from "@prisma/client";

export async function resetDemoData(customPassword = "demo123") {
  const password = customPassword.trim() || "demo123";
  const passwordHash = await bcrypt.hash(password, 10);

  // Clean existing transactional data safely
  await prisma.$transaction([
    prisma.taskChecklistItem.deleteMany(),
    prisma.taskComment.deleteMany(),
    prisma.meetingActionItem.deleteMany(),
    prisma.meetingNote.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.invoiceItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.task.deleteMany(),
    prisma.recurringTaskRule.deleteMany(),
    prisma.programMember.deleteMany(),
    prisma.programTemplate.deleteMany(),
    prisma.document.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.program.deleteMany(),
    prisma.clientContact.deleteMany(),
    prisma.client.deleteMany(),
    prisma.session.deleteMany(),
    prisma.authToken.deleteMany(),
    prisma.mutationRequest.deleteMany(),
    prisma.auditLog.deleteMany(),
  ]);

  // 1. Organization Settings
  await prisma.organizationSettings.upsert({
    where: { id: "organization" },
    update: {
      name: "Shaff Development",
      email: "hello@shaff.dev",
      address: "Jl. Diponegoro No. 45, Bandung",
      phone: "0812-3456-7890",
      bankName: "Bank Central Asia (BCA)",
      bankAccountName: "Shaff Development",
      bankAccountNo: "8820-1928-31",
    },
    create: {
      id: "organization",
      name: "Shaff Development",
      email: "hello@shaff.dev",
      address: "Jl. Diponegoro No. 45, Bandung",
      phone: "0812-3456-7890",
      bankName: "Bank Central Asia (BCA)",
      bankAccountName: "Shaff Development",
      bankAccountNo: "8820-1928-31",
    },
  });

  // 2. Users with predictable passwords
  const admin = await prisma.user.upsert({
    where: { email: "admin@shaff.dev" },
    update: { name: "Admin Shaff", jobTitle: "Administrator", role: UserRole.ADMIN, passwordHash, status: "ACTIVE" },
    create: { name: "Admin Shaff", jobTitle: "Administrator", email: "admin@shaff.dev", role: UserRole.ADMIN, passwordHash },
  });

  const lead = await prisma.user.upsert({
    where: { email: "lead@shaff.dev" },
    update: { name: "Rizky Zaneva", jobTitle: "Lead Operasional", role: UserRole.LEAD, passwordHash, status: "ACTIVE" },
    create: { name: "Rizky Zaneva", jobTitle: "Lead Operasional", email: "lead@shaff.dev", role: UserRole.LEAD, passwordHash },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@shaff.dev" },
    update: { name: "Alya Putri", jobTitle: "Pendamping Bisnis", role: UserRole.MEMBER, passwordHash, status: "ACTIVE" },
    create: { name: "Alya Putri", jobTitle: "Pendamping Bisnis", email: "member@shaff.dev", role: UserRole.MEMBER, passwordHash },
  });

  const finance = await prisma.user.upsert({
    where: { email: "finance@shaff.dev" },
    update: { name: "Finance Shaff", jobTitle: "Finance & Tax", role: UserRole.FINANCE, passwordHash, status: "ACTIVE" },
    create: { name: "Finance Shaff", jobTitle: "Finance & Tax", email: "finance@shaff.dev", role: UserRole.FINANCE, passwordHash },
  });

  const ceo = await prisma.user.upsert({
    where: { email: "ceo@shaff.dev" },
    update: { name: "CEO Shaff", jobTitle: "Chief Executive Officer", role: UserRole.ADMIN, passwordHash, status: "ACTIVE" },
    create: { name: "CEO Shaff", jobTitle: "Chief Executive Officer", email: "ceo@shaff.dev", role: UserRole.ADMIN, passwordHash },
  });

  const cmo = await prisma.user.upsert({
    where: { email: "cmo@shaff.dev" },
    update: { name: "CMO Shaff", jobTitle: "Chief Marketing Officer", role: UserRole.LEAD, passwordHash, status: "ACTIVE" },
    create: { name: "CMO Shaff", jobTitle: "Chief Marketing Officer", email: "cmo@shaff.dev", role: UserRole.LEAD, passwordHash },
  });

  const cto = await prisma.user.upsert({
    where: { email: "cto@shaff.dev" },
    update: { name: "CTO Shaff", jobTitle: "Chief Technology Officer", role: UserRole.MEMBER, passwordHash, status: "ACTIVE" },
    create: { name: "CTO Shaff", jobTitle: "Chief Technology Officer", email: "cto@shaff.dev", role: UserRole.MEMBER, passwordHash },
  });

  const cfo = await prisma.user.upsert({
    where: { email: "cfo@shaff.dev" },
    update: { name: "CFO Shaff", jobTitle: "Chief Financial Officer", role: UserRole.FINANCE, passwordHash, status: "ACTIVE" },
    create: { name: "CFO Shaff", jobTitle: "Chief Financial Officer", email: "cfo@shaff.dev", role: UserRole.FINANCE, passwordHash },
  });

  const coo = await prisma.user.upsert({
    where: { email: "coo@shaff.dev" },
    update: { name: "COO Shaff", jobTitle: "Chief Operating Officer", role: UserRole.ADMIN, passwordHash, status: "ACTIVE" },
    create: { name: "COO Shaff", jobTitle: "Chief Operating Officer", email: "coo@shaff.dev", role: UserRole.ADMIN, passwordHash },
  });

  // 3. Demo Clients
  const clientKopi = await prisma.client.create({
    data: {
      id: "demo-client-kopi",
      businessName: "Kopi Ruang Tengah",
      sector: "F&B / Coffee Shop",
      address: "Jl. R.E. Martadinata No. 88, Bandung",
      notes: "Bisnis coffee shop berkembang dengan 3 cabang di Bandung.",
      status: ClientStatus.ACTIVE,
      leadId: lead.id,
      contacts: {
        create: [
          { name: "Nadia Putri", title: "Founder & Owner", email: "nadia@kopiruang.test", phone: "081234567890", isPrimary: true },
          { name: "Dimas Anggara", title: "Operational Manager", email: "dimas@kopiruang.test", phone: "081298765432", isPrimary: false },
        ],
      },
    },
  });

  const clientBatik = await prisma.client.create({
    data: {
      id: "demo-client-batik",
      businessName: "Batik Nusantara Heritage",
      sector: "Fashion & Retail",
      address: "Jl. Slamet Riyadi No. 120, Surakarta",
      notes: "Produsen batik tulis dan cap modern dengan target ekspansi e-commerce.",
      status: ClientStatus.ACTIVE,
      leadId: lead.id,
      contacts: {
        create: [
          { name: "Hendra Kusuma", title: "Direktur Utama", email: "hendra@batiknusantara.test", phone: "081122334455", isPrimary: true },
        ],
      },
    },
  });

  const clientKuliner = await prisma.client.create({
    data: {
      id: "demo-client-kuliner",
      businessName: "Dapur Rasa Ibu",
      sector: "Kuliner / Catering",
      address: "Jl. Tebet Raya No. 15, Jakarta Selatan",
      notes: "Catering harian korporat dan acara keluarga.",
      status: ClientStatus.ACTIVE,
      leadId: cmo.id,
      contacts: {
        create: [
          { name: "Ibu Maya", title: "Pemilik", email: "maya@dapurrasa.test", phone: "081377889900", isPrimary: true },
        ],
      },
    },
  });

  // 4. Programs
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const targetDate = new Date(now.getFullYear(), now.getMonth() + 2, 28);

  const progKopi = await prisma.program.create({
    data: {
      id: "demo-prog-kopi",
      clientId: clientKopi.id,
      name: "Digitalisasi Sistem Kasir & Inventori",
      serviceType: ServiceType.COMBINED,
      objective: "Merapikan alur kasir POS multi-outlet, kontrol stok real-time, dan laporan keuangan mingguan.",
      deliverables: "SOP Kasir & Stok, Integrasi POS cloud, Dashboard penjualan, Pelatihan tim outlet",
      startDate,
      targetDate,
      status: ProgramStatus.ACTIVE,
      healthScore: 90,
      risk: "HEALTHY",
      members: {
        create: [
          { userId: lead.id },
          { userId: member.id },
          { userId: cto.id },
        ],
      },
    },
  });

  const progBatik = await prisma.program.create({
    data: {
      id: "demo-prog-batik",
      clientId: clientBatik.id,
      name: "Pendampingan Bisnis & Scale Up E-Commerce",
      serviceType: ServiceType.BUSINESS_MENTORING,
      objective: "Menyusun strategi pricing digital, restrukturisasi tim sales, dan efisiensi fulfillment.",
      deliverables: "Financial model 2026, SOP Fulfillment e-commerce, Dashboard KPI sales",
      startDate,
      targetDate,
      status: ProgramStatus.ACTIVE,
      healthScore: 82,
      risk: "HEALTHY",
      members: {
        create: [
          { userId: lead.id },
          { userId: member.id },
        ],
      },
    },
  });

  const progKuliner = await prisma.program.create({
    data: {
      id: "demo-prog-kuliner",
      clientId: clientKuliner.id,
      name: "Standarisasi Sistem Keuangan & Pembelian Bahan",
      serviceType: ServiceType.SYSTEM_DIGITALIZATION,
      objective: "Pemisahan keuangan pribadi & bisnis, serta automasi rekap faktur belanja harian.",
      deliverables: "SOP Pembelian & Rekonsiliasi kas harian, Template budget mingguan",
      startDate,
      targetDate,
      status: ProgramStatus.ON_HOLD,
      healthScore: 65,
      risk: "ATTENTION",
      riskNote: "Menunggu kelengkapan mutasi rekening koran dari pihak client.",
      members: {
        create: [
          { userId: cmo.id },
          { userId: member.id },
        ],
      },
    },
  });

  // 5. Tasks with interactive checklists
  const task1 = await prisma.task.create({
    data: {
      id: "demo-task-1",
      programId: progKopi.id,
      assigneeId: member.id,
      title: "Review dan audit dashboard kasir outlet Bandung",
      description: "Lakukan pengecekan data transaksi dari ketiga outlet selama bulan berjalan. Pastikan selisih kas fisik dan sistem 0%.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60_000),
      checklist: {
        create: [
          { label: "Tarik data rekap transaksi POS outlet 1, 2, dan 3", isDone: true, sortOrder: 0 },
          { label: "Bandingkan bukti setor kas dengan mutasi rekening", isDone: true, sortOrder: 1 },
          { label: "Verifikasi void nota dan diskon kasir", isDone: false, sortOrder: 2 },
          { label: "Kirim ringkasan review ke PIC Kopi Ruang Tengah", isDone: false, sortOrder: 3 },
        ],
      },
      comments: {
        create: [
          {
            authorId: member.id,
            body: "Data outlet 1 dan 2 sudah sinkron. Sedang menunggu rekap struk fisik outlet 3.",
          },
        ],
      },
    },
  });

  const task2 = await prisma.task.create({
    data: {
      id: "demo-task-2",
      programId: progKopi.id,
      assigneeId: lead.id,
      title: "Finalisasi draft SOP pembukaan dan penutupan shift",
      description: "Menyusun panduan resmi serah terima kasir, audit laci kasir, dan penanganan mesin EDC saat offline.",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60_000),
      checklist: {
        create: [
          { label: "Susun checklist buka shift kasir", isDone: true, sortOrder: 0 },
          { label: "Susun alur penutupan & brankas", isDone: false, sortOrder: 1 },
          { label: "Review bersama Lead Operasional", isDone: false, sortOrder: 2 },
        ],
      },
    },
  });

  const task3 = await prisma.task.create({
    data: {
      id: "demo-task-3",
      programId: progKopi.id,
      assigneeId: lead.id,
      title: "Setup template perhitungan COGS kopi dan bahan baku",
      description: "Standardisasi harga pokok penjualan per cup untuk menjaga margin keuntungan di atas 65%.",
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60_000),
      completedAt: new Date(),
      completionNote: "Template COGS berbasis spreadsheet telah diserahkan dan disimulasikan kepada tim barista.",
      checklist: {
        create: [
          { label: "Input recipe standard gramasi espresso & susu", isDone: true, sortOrder: 0 },
          { label: "Hitung packaging cup, seal, dan sedotan", isDone: true, sortOrder: 1 },
          { label: "Approval margin dengan owner", isDone: true, sortOrder: 2 },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      id: "demo-task-4",
      programId: progBatik.id,
      assigneeId: member.id,
      title: "Penyusunan alur fulfillment gudang e-commerce",
      description: "Membuat standar waktu packing pesanan marketplace maksimal 24 jam.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60_000),
      checklist: {
        create: [
          { label: "Desain layout rak picking kain", isDone: true, sortOrder: 0 },
          { label: "Buat form quality control sebelum kirim", isDone: false, sortOrder: 1 },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      id: "demo-task-5",
      programId: progKuliner.id,
      assigneeId: cmo.id,
      title: "Rekonsiliasi invoice supplier bahan basah pasar",
      description: "Menghubungkan nota harian belanja ayam dan sayur ke buku kas besar.",
      status: TaskStatus.BLOCKED,
      priority: TaskPriority.URGENT,
      dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60_000),
      blockedReason: "PIC belanja belum menyerahkan kwitansi basah minggu kedua.",
    },
  });

  // 6. Invoices and Payments
  const inv1 = await prisma.invoice.create({
    data: {
      id: "demo-inv-kopi",
      clientId: clientKopi.id,
      programId: progKopi.id,
      createdById: finance.id,
      invoiceNumber: "SD/2026/0001",
      issueDate: new Date(now.getFullYear(), now.getMonth(), 1),
      dueDate: new Date(now.getFullYear(), now.getMonth(), 25),
      status: InvoiceStatus.ISSUED,
      approvalStatus: ApprovalStatus.APPROVED,
      clientNameSnapshot: clientKopi.businessName,
      clientAddressSnapshot: clientKopi.address,
      organizationNameSnapshot: "Shaff Development",
      bankSnapshot: "Bank BCA — 8820-1928-31 a.n Shaff Development",
      totalAmount: 7500000,
      issuedAt: new Date(now.getFullYear(), now.getMonth(), 1),
      items: {
        create: [
          { description: "Pendampingan & Digitalisasi Sistem Kasir Outlet (Tahap 1)", quantity: 1, unitPrice: 5000000, amount: 5000000 },
          { description: "Setup Cloud POS & Konfigurasi Multi-Outlet", quantity: 1, unitPrice: 2500000, amount: 2500000 },
        ],
      },
      payments: {
        create: [
          {
            recordedById: finance.id,
            amount: 3500000,
            paidAt: new Date(now.getFullYear(), now.getMonth(), 5),
            method: PaymentMethod.TRANSFER,
            reference: "TRX-BCA-88912",
            status: PaymentStatus.VALID,
          },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      id: "demo-inv-batik",
      clientId: clientBatik.id,
      programId: progBatik.id,
      createdById: finance.id,
      invoiceNumber: "SD/2026/0002",
      issueDate: new Date(now.getFullYear(), now.getMonth(), 2),
      dueDate: new Date(now.getFullYear(), now.getMonth(), 28),
      status: InvoiceStatus.ISSUED,
      approvalStatus: ApprovalStatus.APPROVED,
      clientNameSnapshot: clientBatik.businessName,
      clientAddressSnapshot: clientBatik.address,
      organizationNameSnapshot: "Shaff Development",
      bankSnapshot: "Bank BCA — 8820-1928-31 a.n Shaff Development",
      totalAmount: 10000000,
      issuedAt: new Date(now.getFullYear(), now.getMonth(), 2),
      items: {
        create: [
          { description: "Program Scale Up E-Commerce & Mentoring Bisnis (Bulan 1)", quantity: 1, unitPrice: 10000000, amount: 10000000 },
        ],
      },
      payments: {
        create: [
          {
            recordedById: finance.id,
            amount: 10000000,
            paidAt: new Date(now.getFullYear(), now.getMonth(), 4),
            method: PaymentMethod.TRANSFER,
            reference: "TRX-MANDIRI-4401",
            status: PaymentStatus.VALID,
          },
        ],
      },
    },
  });

  // 7. Meeting Notes
  await prisma.meetingNote.create({
    data: {
      id: "demo-meet-1",
      clientId: clientKopi.id,
      programId: progKopi.id,
      creatorId: lead.id,
      title: "Kickoff Meeting & Blueprint Sistem Outlet",
      meetingAt: new Date(now.getFullYear(), now.getMonth(), 3, 10, 0),
      participants: "Rizky Zaneva, Alya Putri, Nadia Putri (Owner), Dimas (Ops)",
      status: MeetingStatus.FINAL,
      summary: "Diskusi target integrasi kasir 3 cabang dan pembagian wewenang supervisor outlet.",
      summaryText: "- Sinkronisasi data kasir disepakati memakai cloud POS.\n- Pemotongan kasir tidak boleh melebihi toleransi Rp 10.000 per hari.\n- Evaluasi mingguan diadakan setiap Senin pagi.",
      decisionsText: "1. Pemilihan vendor POS disetujui.\n2. Target go-live per 1 Oktober 2026.\n3. SOP kasir harus ditandatangani seluruh barista.",
      actionItems: {
        create: [
          { description: "Susun draft SOP kasir operasional", taskId: task2.id },
          { description: "Audit data penjualan harian outlet", taskId: task1.id },
        ],
      },
    },
  });

  // 8. Sample Expenses
  await prisma.expense.createMany({
    data: [
      {
        category: ExpenseCategory.GAJI,
        description: "Gaji pokok & tunjangan tim operasional Shaff",
        amount: 18500000,
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 1),
        createdById: finance.id,
        notes: "Gaji periode berjalan 4 personil inti.",
      },
      {
        category: ExpenseCategory.TOOLS_SOFTWARE,
        description: "Langganan cloud server, database & domain",
        amount: 1450000,
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 2),
        createdById: finance.id,
        notes: "Server hosting & tooling automasi.",
      },
      {
        category: ExpenseCategory.OPERASIONAL,
        description: "Kunjungan kerja & pendampingan langsung ke outlet client",
        amount: 850000,
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 5),
        createdById: admin.id,
        notes: "Transport dan akomodasi pendampingan Bandung.",
      },
    ],
  });

  // 9. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "DEMO_DATABASE_RESET",
      objectType: "System",
      objectId: "database",
      changes: {
        timestamp: new Date().toISOString(),
        users: 9,
        clients: 3,
        programs: 3,
        tasks: 5,
        invoices: 2,
        expenses: 3,
        defaultPassword: password,
      },
    },
  });

  return {
    success: true,
    message: "Data dummy dan seluruh akun berhasil di-reset dengan rapi.",
    passwordUsed: password,
    accounts: [
      { role: "ADMIN", email: "admin@shaff.dev", name: "Admin Shaff", password },
      { role: "LEAD", email: "lead@shaff.dev", name: "Rizky Zaneva", password },
      { role: "MEMBER", email: "member@shaff.dev", name: "Alya Putri", password },
      { role: "FINANCE", email: "finance@shaff.dev", name: "Finance Shaff", password },
      { role: "ADMIN", email: "ceo@shaff.dev", name: "CEO Shaff", password },
      { role: "LEAD", email: "cmo@shaff.dev", name: "CMO Shaff", password },
      { role: "MEMBER", email: "cto@shaff.dev", name: "CTO Shaff", password },
      { role: "FINANCE", email: "cfo@shaff.dev", name: "CFO Shaff", password },
      { role: "ADMIN", email: "coo@shaff.dev", name: "COO Shaff", password },
    ],
  };
}
