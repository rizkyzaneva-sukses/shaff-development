import type { DashboardClient, DashboardMetrics, DashboardTask } from "./types";

export const demoMetrics: DashboardMetrics = {
  activeClients: 12,
  activePrograms: 15,
  overdueTasks: 4,
  dueThisWeek: 9,
  receivables: 18750000
};

export const demoClients: DashboardClient[] = [
  { id: "client-kopi-ruang", businessName: "Kopi Ruang Tengah", sector: "F&B", programName: "Digitalisasi Operasional", progress: 72, status: "ACTIVE", nextAction: "Review laporan penjualan" },
  { id: "client-batik-nusantara", businessName: "Batik Nusantara", sector: "Fashion", programName: "Pendampingan Bisnis", progress: 48, status: "ACTIVE", nextAction: "Sesi konsultasi strategi" },
  { id: "client-rasa-ibu", businessName: "Dapur Rasa Ibu", sector: "Kuliner", programName: "Sistem Keuangan", progress: 24, status: "ON_HOLD", nextAction: "Menunggu data transaksi" },
  { id: "client-kebun-kita", businessName: "Kebun Kita", sector: "Agribisnis", programName: "Gabungan", progress: null, status: "PROSPECT", nextAction: "Lengkapi asesmen awal" }
];

export const demoTasks: DashboardTask[] = [
  { id: "task-1", title: "Review dashboard penjualan", clientName: "Kopi Ruang Tengah", programName: "Digitalisasi Operasional", status: "IN_PROGRESS", priority: "HIGH", dueDate: "2026-09-12", assigneeName: "Rizky Zaneva" },
  { id: "task-2", title: "Kirim template SOP kasir", clientName: "Batik Nusantara", programName: "Pendampingan Bisnis", status: "TODO", priority: "MEDIUM", dueDate: "2026-09-13", assigneeName: "Alya Putri" },
  { id: "task-3", title: "Validasi data transaksi Agustus", clientName: "Dapur Rasa Ibu", programName: "Sistem Keuangan", status: "BLOCKED", priority: "URGENT", dueDate: "2026-09-10", assigneeName: "Rizky Zaneva" },
  { id: "task-4", title: "Susun ringkasan hasil asesmen", clientName: "Kebun Kita", programName: "Gabungan", status: "DONE", priority: "LOW", dueDate: "2026-09-08", assigneeName: "Alya Putri" }
];
