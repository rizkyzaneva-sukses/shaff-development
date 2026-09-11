export type ClientStatus = "ACTIVE" | "PROSPECT" | "ON_HOLD" | "ARCHIVED"
export type ProgramStatus = "ACTIVE" | "PLANNED" | "ON_HOLD" | "COMPLETED"
export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE"
export type Priority = "URGENT" | "HIGH" | "MEDIUM" | "LOW"

export type Client = {
  id: string
  name: string
  shortName: string
  sector: string
  status: ClientStatus
  lead: string
  initials: string
  accent: string
  city: string
  contact: string
  contactRole: string
  phone: string
  email: string
  programs: number
  activeProgram: string
  progress: number
  nextAction: string
  nextActionDate: string
  outstanding: number
}

export type Program = {
  id: string
  clientId: string
  client: string
  name: string
  type: string
  status: ProgramStatus
  progress: number
  start: string
  target: string
  lead: string
  taskCount: number
  doneCount: number
  blockedCount: number
  description: string
  deliverable: string
}

export type Task = {
  id: string
  title: string
  client: string
  clientId: string
  program: string
  status: TaskStatus
  priority: Priority
  assignee: string
  initials: string
  due: string
  dueLabel: string
  detail: string
}

export const clients: Client[] = [
  {
    id: "cl-senja",
    name: "Kedai Senja",
    shortName: "Kedai Senja",
    sector: "Kuliner · F&B",
    status: "ACTIVE",
    lead: "Nadia Putri",
    initials: "KS",
    accent: "coral",
    city: "Bandung",
    contact: "Raka Pratama",
    contactRole: "Pemilik",
    phone: "+62 812 4490 1122",
    email: "raka@kedaisenja.id",
    programs: 2,
    activeProgram: "Digitalisasi Operasional",
    progress: 68,
    nextAction: "Review alur kas harian",
    nextActionDate: "Hari ini",
    outstanding: 4500000,
  },
  {
    id: "cl-akar",
    name: "Akar Rasa",
    shortName: "Akar Rasa",
    sector: "Produk lokal · FMCG",
    status: "ACTIVE",
    lead: "Maya Sari",
    initials: "AR",
    accent: "teal",
    city: "Yogyakarta",
    contact: "Dewi Lestari",
    contactRole: "Co-founder",
    phone: "+62 813 8891 2044",
    email: "dewi@akarrasa.co",
    programs: 1,
    activeProgram: "Pendampingan Bisnis",
    progress: 42,
    nextAction: "Kirim hasil asesmen",
    nextActionDate: "Besok",
    outstanding: 0,
  },
  {
    id: "cl-loka",
    name: "Studio Loka",
    shortName: "Studio Loka",
    sector: "Kreatif · Interior",
    status: "ACTIVE",
    lead: "Nadia Putri",
    initials: "SL",
    accent: "violet",
    city: "Jakarta Selatan",
    contact: "Bimo Adinata",
    contactRole: "Director",
    phone: "+62 811 1300 765",
    email: "bimo@studioloka.co",
    programs: 1,
    activeProgram: "Sistem Keuangan",
    progress: 84,
    nextAction: "Finalisasi dashboard",
    nextActionDate: "12 Sep",
    outstanding: 12500000,
  },
  {
    id: "cl-rimbun",
    name: "Rimbun Works",
    shortName: "Rimbun Works",
    sector: "Fashion · Retail",
    status: "ON_HOLD",
    lead: "Faris Akbar",
    initials: "RW",
    accent: "amber",
    city: "Surabaya",
    contact: "Sinta Rahma",
    contactRole: "Owner",
    phone: "+62 852 9921 7880",
    email: "sinta@rimbunworks.com",
    programs: 1,
    activeProgram: "Fondasi Bisnis",
    progress: 31,
    nextAction: "Tunggu data penjualan",
    nextActionDate: "15 Sep",
    outstanding: 2800000,
  },
  {
    id: "cl-ruang",
    name: "Ruang Tumbuh",
    shortName: "Ruang Tumbuh",
    sector: "Edukasi · Konsultan",
    status: "PROSPECT",
    lead: "Maya Sari",
    initials: "RT",
    accent: "blue",
    city: "Semarang",
    contact: "Naufal Hakim",
    contactRole: "Founder",
    phone: "+62 822 3411 9090",
    email: "naufal@ruangtumbuh.id",
    programs: 0,
    activeProgram: "Belum ada program",
    progress: 0,
    nextAction: "Discovery call",
    nextActionDate: "18 Sep",
    outstanding: 0,
  },
]

export const programs: Program[] = [
  {
    id: "prg-senja-digital",
    clientId: "cl-senja",
    client: "Kedai Senja",
    name: "Digitalisasi Operasional",
    type: "Digitalisasi Sistem",
    status: "ACTIVE",
    progress: 68,
    start: "04 Agu 2026",
    target: "30 Sep 2026",
    lead: "Nadia Putri",
    taskCount: 19,
    doneCount: 13,
    blockedCount: 1,
    description: "Merapikan alur order, stok, dan kas agar tim Kedai Senja dapat bekerja lebih tenang.",
    deliverable: "Playbook operasional, dashboard kas, dan SOP shift",
  },
  {
    id: "prg-akar-bisnis",
    clientId: "cl-akar",
    client: "Akar Rasa",
    name: "Pendampingan Bisnis",
    type: "Pendampingan Bisnis",
    status: "ACTIVE",
    progress: 42,
    start: "12 Agu 2026",
    target: "25 Okt 2026",
    lead: "Maya Sari",
    taskCount: 12,
    doneCount: 5,
    blockedCount: 0,
    description: "Menata cara mengambil keputusan berbasis angka untuk produk lokal yang sedang bertumbuh.",
    deliverable: "Asesmen bisnis, rencana 90 hari, dan ritme review",
  },
  {
    id: "prg-loka-finance",
    clientId: "cl-loka",
    client: "Studio Loka",
    name: "Sistem Keuangan",
    type: "Digitalisasi Sistem",
    status: "ACTIVE",
    progress: 84,
    start: "20 Jul 2026",
    target: "16 Sep 2026",
    lead: "Nadia Putri",
    taskCount: 25,
    doneCount: 21,
    blockedCount: 0,
    description: "Membuat sistem keuangan yang mudah dibaca sebelum keputusan proyek dibuat.",
    deliverable: "Template cashflow, dashboard margin, dan training",
  },
  {
    id: "prg-rimbun-foundation",
    clientId: "cl-rimbun",
    client: "Rimbun Works",
    name: "Fondasi Bisnis",
    type: "Pendampingan Bisnis",
    status: "ON_HOLD",
    progress: 31,
    start: "01 Sep 2026",
    target: "15 Nov 2026",
    lead: "Faris Akbar",
    taskCount: 13,
    doneCount: 4,
    blockedCount: 2,
    description: "Mendefinisikan fondasi operasional dan prioritas pertumbuhan Rimbun Works.",
    deliverable: "Peta proses, prioritas kuartal, dan meeting rhythm",
  },
]

export const tasks: Task[] = [
  { id: "tsk-01", title: "Review alur kas harian", client: "Kedai Senja", clientId: "cl-senja", program: "Digitalisasi Operasional", status: "IN_PROGRESS", priority: "URGENT", assignee: "Nadia Putri", initials: "NP", due: "2026-09-11", dueLabel: "Hari ini", detail: "Validasi alur pencatatan kas bersama Raka." },
  { id: "tsk-02", title: "Kirim hasil asesmen bisnis", client: "Akar Rasa", clientId: "cl-akar", program: "Pendampingan Bisnis", status: "TODO", priority: "HIGH", assignee: "Maya Sari", initials: "MS", due: "2026-09-12", dueLabel: "Besok", detail: "Kirim ringkasan temuan dan tiga prioritas awal." },
  { id: "tsk-03", title: "Finalisasi dashboard margin", client: "Studio Loka", clientId: "cl-loka", program: "Sistem Keuangan", status: "IN_PROGRESS", priority: "HIGH", assignee: "Nadia Putri", initials: "NP", due: "2026-09-12", dueLabel: "Besok", detail: "Periksa rumus margin per proyek sebelum demo." },
  { id: "tsk-04", title: "Minta data penjualan Agustus", client: "Rimbun Works", clientId: "cl-rimbun", program: "Fondasi Bisnis", status: "BLOCKED", priority: "MEDIUM", assignee: "Faris Akbar", initials: "FA", due: "2026-09-15", dueLabel: "15 Sep", detail: "Menunggu export data dari Sinta." },
  { id: "tsk-05", title: "Discovery call kebutuhan sistem", client: "Ruang Tumbuh", clientId: "cl-ruang", program: "Pra-program", status: "TODO", priority: "MEDIUM", assignee: "Maya Sari", initials: "MS", due: "2026-09-18", dueLabel: "18 Sep", detail: "Gali konteks tim dan target tiga bulan pertama." },
  { id: "tsk-06", title: "Rapikan SOP opening shift", client: "Kedai Senja", clientId: "cl-senja", program: "Digitalisasi Operasional", status: "DONE", priority: "MEDIUM", assignee: "Dimas Arif", initials: "DA", due: "2026-09-10", dueLabel: "Selesai kemarin", detail: "SOP sudah disetujui tim kedai." },
  { id: "tsk-07", title: "Susun agenda review mingguan", client: "Studio Loka", clientId: "cl-loka", program: "Sistem Keuangan", status: "DONE", priority: "LOW", assignee: "Nadia Putri", initials: "NP", due: "2026-09-10", dueLabel: "Selesai kemarin", detail: "Ritme review disepakati setiap Senin." },
]

export const activities = [
  { icon: "check", title: "Dimas menyelesaikan SOP opening shift", meta: "Kedai Senja · 36 menit lalu", tone: "mint" },
  { icon: "note", title: "Nadia menambahkan catatan konsultasi", meta: "Studio Loka · 2 jam lalu", tone: "lilac" },
  { icon: "file", title: "Dokumen baru diunggah", meta: "Akar Rasa · 4 jam lalu", tone: "sand" },
  { icon: "payment", title: "Pembayaran Rp 7.500.000 dicatat", meta: "Studio Loka · Kemarin", tone: "amber" },
]

export const team = [
  { name: "Nadia Putri", role: "Lead", initials: "NP", color: "coral", active: 8 },
  { name: "Maya Sari", role: "Lead", initials: "MS", color: "violet", active: 5 },
  { name: "Faris Akbar", role: "Pendamping", initials: "FA", color: "amber", active: 4 },
  { name: "Dimas Arif", role: "Pendamping", initials: "DA", color: "teal", active: 3 },
]

export const formatIDR = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value)
