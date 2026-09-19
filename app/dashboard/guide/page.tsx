"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";

const workflow = [
  { step: "01", title: "Client", text: "Pastikan profil usaha, PIC, status, dan kebutuhan awal tercatat.", href: "/dashboard/clients", icon: "users" },
  { step: "02", title: "Program", text: "Buat ruang kerja pendampingan dengan target, layanan, dan deliverable.", href: "/dashboard/programs", icon: "layers" },
  { step: "03", title: "Task", text: "Pecah deliverable menjadi pekerjaan dengan PIC, deadline, prioritas, dan status.", href: "/dashboard/tasks", icon: "checkSquare" },
  { step: "04", title: "Meeting", text: "Simpan agenda, peserta, keputusan, dan action item setiap konsultasi.", href: "/dashboard/meetings", icon: "note" },
  { step: "05", title: "Dokumen", text: "Unggah assessment, materi, deliverable, dan bukti pembayaran ke program terkait.", href: "/dashboard/documents", icon: "file" },
  { step: "06", title: "Invoice → Payment", text: "Finance menerbitkan invoice, mencatat pembayaran, lalu memantau piutang.", href: "/dashboard/invoices", icon: "invoice" },
];

// Jabatan tim dipetakan ke hak akses (role). Jabatan tidak mengubah izin —
// izin selalu mengikuti role, jabatan hanya label organisasi.
const jabatan = [
  { title: "CEO", role: "LEAD", tone: "teal", rhythm: "Senin pagi · 30 menit", focus: "Arah dan keputusan", actions: ["Buka Ringkasan dan lihat kesehatan portofolio.", "Tinjau program overdue atau BLOCKED.", "Kelola client dan program yang Anda pimpin.", "Lihat action log untuk jejak keputusan."] },
  { title: "COO", role: "MEMBER", tone: "violet", rhythm: "Harian · 10–15 menit", focus: "Ritme eksekusi", actions: ["Pastikan setiap program punya PIC dan next action.", "Triage task overdue dan BLOCKED pada program Anda.", "Review catatan meeting yang belum FINAL.", "Lihat pengeluaran operasional (hanya baca, tidak mengubah)."] },
  { title: "CMO", role: "MEMBER", tone: "blue", rhythm: "Mingguan per client", focus: "Kualitas pendampingan", actions: ["Baca konteks client dan objective program.", "Review progress, deliverable, dan feedback konsultasi.", "Catat insight kebutuhan client sebagai action item.", "Unggah materi dan deliverable ke program terkait."] },
  { title: "CFO", role: "FINANCE", tone: "amber", rhythm: "Harian · 10 menit", focus: "Invoice dan arus kas", actions: ["Buka Invoice dan cek jatuh tempo.", "Terbitkan invoice hanya setelah scope dan nominal disetujui.", "Catat pembayaran dengan nominal, metode, referensi, dan bukti.", "Gunakan void dengan alasan jika ada koreksi; jangan hapus transaksi."] },
  { title: "ADMIN", role: "ADMIN", tone: "coral", rhythm: "Sesuai kebutuhan", focus: "Sistem dan akun", actions: ["Kelola akun tim, role, dan akses.", "Input client dan ubah status client.", "Pantau action log seluruh workspace.", "Pastikan deployment, backup, dan error log sehat."] },
];

const roles = jabatan;

const matrix = [
  ["ADMIN", "Penuh", "Penuh", "Penuh", "Penuh", "Penuh", "Ya"],
  ["CEO (LEAD)", "Scope client", "Scope program", "Scope program", "Penuh", "Scope client", "Ya"],
  ["COO / CMO (MEMBER)", "Scope program", "Anggota", "PIC / assignee", "Upload", "Lihat saja", "Tidak"],
  ["CFO (FINANCE)", "Lihat saja", "Ringkasan", "Lihat saja", "Bukti bayar", "Penuh", "Tidak"],
];

type Tab = "quickstart" | "workflow" | "roles" | "permissions" | "rules" | "ops";
const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: "quickstart", label: "Mulai Cepat", icon: "clock" },
  { key: "workflow", label: "Workflow", icon: "layers" },
  { key: "roles", label: "Per Jabatan", icon: "users" },
  { key: "permissions", label: "Akses", icon: "shield" },
  { key: "rules", label: "Aturan", icon: "target" },
  { key: "ops", label: "Operasional", icon: "refresh" },
];

// Langkah deploy yang harus diikuti urut. Diringkas dari docs/PANDUAN-OPERASIONAL.md.
const deploySteps = [
  ["01", "Edit kode di lokal", "Kerjakan perubahan di komputer, bukan langsung di server."],
  ["02", "npm run build", "Wajib. Kalau build lokal gagal, deploy di server pasti gagal juga."],
  ["03", "git commit + push", "Simpan perubahan ke repositori. Push belum membuat kode live."],
  ["04", "Redeploy di EasyPanel", "Push saja tidak cukup — container harus dibangun ulang agar perubahan aktif."],
  ["05", "Cek hasilnya", "Buka shaff.gampangin.biz.id dan pastikan fitur berjalan."],
];

// Diagnosa gejala → penyebab paling mungkin, supaya diagnosa tidak menebak-nebak.
const diagnosa = [
  ["Server Reference ID did not match", "Halaman lama masih tersimpan di cache browser", "Minta user hard refresh: Ctrl + Shift + R"],
  ["Database unavailable di /api/health", "Container database bermasalah, bukan app", "Cek container shaff-db di EasyPanel. Jangan restart app."],
  ["Error hanya pada 1 user saja", "Cache browser user tersebut", "Suruh pakai mode Incognito untuk memastikan"],
  ["Fitur WhatsApp tidak berjalan", "Env WAHA_URL / WAHA_API_KEY belum diisi", "Set di EasyPanel → shaff-app → Environment, lalu redeploy"],
  ["Scheduler recurrent tidak jalan", "CRON_SECRET belum diisi", "Set CRON_SECRET di Environment, lalu redeploy"],
];

// Env yang dibutuhkan aplikasi. Nilai rahasia tidak pernah ditampilkan di halaman ini.
const envStatus = [
  ["DATABASE_URL", "Alamat database", "Terpasang"],
  ["FILE_STORAGE_PATH", "Lokasi penyimpanan file", "Terpasang"],
  ["WAHA_URL", "Alamat server WhatsApp", "Belum diisi"],
  ["WAHA_API_KEY", "Kunci API WhatsApp", "Belum diisi"],
  ["WAHA_SESSION", "Nama sesi WhatsApp", "Belum diisi"],
  ["CRON_SECRET", "Kunci scheduler otomatis", "Belum diisi"],
  ["APP_ORIGIN", "Domain resmi aplikasi", "Belum diisi"],
];

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<Tab>("quickstart");

  return (
    <div className="guide-page page-enter">
      <section className="guide-hero">
        <div>
          <span className="eyebrow">Shaff Development · ruang kerja internal</span>
          <h1>Panduan kerja</h1>
          <p>Satu client → satu atau beberapa program → task, meeting, dokumen → invoice & pembayaran.</p>
        </div>
        <div className="guide-hero-actions">
          <Link href="/dashboard" className="button button-primary"><Icon name="grid" size={16} /> Buka ringkasan</Link>
          <Link href="/dashboard/tasks" className="button button-quiet"><Icon name="checkSquare" size={16} /> Lihat pekerjaan</Link>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto border-b border-[var(--border)] mb-6 pb-px">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? "border-[var(--coral)] text-[var(--ink)]" : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"}`}>
            <Icon name={tab.icon} size={15} />{tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Quick Start */}
      {activeTab === "quickstart" && (
        <section className="guide-quickstart surface">
          <div className="guide-section-heading"><div><span className="eyebrow">Quick start</span><h2>Mulai dalam 15 menit</h2></div><span className="guide-time"><Icon name="clock" size={14} /> ritme kerja harian</span></div>
          <div className="guide-quick-grid">
            {[
              ["01", "Login dan cek Ringkasan", "Mulai dari task yang terlambat, program BLOCKED, dan meeting yang menunggu finalisasi."],
              ["02", "Pilih satu client aktif", "Buka programnya, pahami objective, deliverable, target date, dan siapa PIC-nya."],
              ["03", "Kerjakan satu next action", "Setiap task harus punya assignee, deadline, prioritas, dan status yang benar."],
              ["04", "Tutup loop konsultasi", "Finalkan meeting, ubah action item menjadi task, lalu unggah hasil kerja ke program."],
              ["05", "Review dan eskalasi", "Jika BLOCKED, isi alasan dan pihak yang dibutuhkan. Eskalasi ke Lead, bukan diamkan."],
            ].map(([number, title, text]) => <article className="guide-quick-item" key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}
          </div>
        </section>
      )}

      {/* Tab: Workflow */}
      {activeTab === "workflow" && (
        <section className="guide-section">
          <div className="guide-section-heading"><div><span className="eyebrow">Workflow inti</span><h2>Dari kebutuhan client sampai pembayaran</h2></div><p>Jangan melompati konteks atau keputusan.</p></div>
          <div className="guide-workflow">
            {workflow.map((item, index) => <div className="guide-workflow-item" key={item.title}><Link href={item.href} className="guide-workflow-card"><span className="guide-workflow-step">{item.step}</span><span className="guide-workflow-icon"><Icon name={item.icon} size={18} /></span><h3>{item.title}</h3><p>{item.text}</p><span className="guide-workflow-link">Buka modul <Icon name="arrowRight" size={14} /></span></Link>{index < workflow.length - 1 && <span className="guide-workflow-arrow"><Icon name="arrowRight" size={16} /></span>}</div>)}
          </div>
        </section>
      )}

      {/* Tab: Per Jabatan */}
      {activeTab === "roles" && (
        <section className="guide-section">
          <div className="guide-section-heading"><div><span className="eyebrow">Quick start per jabatan</span><h2>Yang perlu dibuka oleh tiap peran</h2></div><p>Jabatan menentukan siapa mengerjakan apa; hak akses tetap mengikuti role di belakangnya.</p></div>
          <div className="guide-role-grid">
            {roles.map((role) => <article className={`guide-role-card guide-role-${role.tone}`} key={role.title}><div className="guide-role-head"><span className="guide-role-avatar">{role.title[0]}</span><div><h3>{role.title}</h3><span>{role.focus} · akses {role.role}</span></div></div><div className="guide-role-rhythm"><Icon name="calendar" size={14} /> {role.rhythm}</div><ul>{role.actions.map((action) => <li key={action}><Icon name="check" size={14} /> <span>{action}</span></li>)}</ul></article>)}
          </div>

          <div className="guide-section-heading" style={{ marginTop: "2rem" }}><div><span className="eyebrow">Peta jabatan</span><h2>Jabatan → hak akses</h2></div><p>Jabatan hanya label; izin selalu mengikuti role.</p></div>
          <div className="guide-table-wrap"><table className="guide-table"><thead><tr><th>Jabatan</th><th>Hak akses</th><th>Cakupan kerja</th></tr></thead><tbody>{[
            ["CEO", "LEAD", "Semua modul client & program yang dipimpin, termasuk action log"],
            ["COO", "MEMBER", "Eksekusi program, task, meeting, dokumen — keuangan hanya baca"],
            ["CMO", "MEMBER", "Kualitas pendampingan, materi, deliverable — keuangan hanya baca"],
            ["CFO", "FINANCE", "Invoice, pembayaran, pengeluaran penuh — client/task hanya baca"],
            ["ADMIN", "ADMIN", "Seluruh workspace, kelola akun, input client, action log"],
          ].map((row) => <tr key={row[0]}><td><span className="guide-table-role">{row[0]}</span></td><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table></div>
        </section>
      )}

      {/* Tab: Permissions */}
      {activeTab === "permissions" && (
        <section className="guide-section guide-permission-section">
          <div className="guide-section-heading"><div><span className="eyebrow">Permission map</span><h2>Peran menentukan ruang kerja</h2></div><p>Admin mengelola workspace; akses data client mengikuti assignment.</p></div>
          <div className="guide-table-wrap"><table className="guide-table"><thead><tr><th>Jabatan</th><th>Client</th><th>Program</th><th>Task</th><th>Meeting / dokumen</th><th>Keuangan</th><th>Action log</th></tr></thead><tbody>{matrix.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}><span className={index === 0 ? "guide-table-role" : undefined}>{cell}</span></td>)}</tr>)}</tbody></table></div>
          <p className="guide-note"><Icon name="spark" size={15} /> Keuangan hanya dapat diubah oleh ADMIN dan CFO. COO dan CMO boleh melihat pengeluaran untuk konteks operasional, tetapi tidak dapat menambah atau mengubahnya.</p>
          <p className="guide-note"><Icon name="spark" size={15} /> History dan log aktivitas client dapat dilihat semua jabatan sesuai scope-nya. Action log workspace hanya untuk ADMIN dan CEO.</p>
        </section>
      )}

      {/* Tab: Rules */}
      {activeTab === "rules" && (
        <section className="guide-rules surface">
          <div className="guide-section-heading"><div><span className="eyebrow">Aturan kerja wajib</span><h2>Definisi selesai yang sama untuk semua</h2></div><Icon name="target" size={22} /></div>
          <div className="guide-rules-grid">
            <div><strong>Task</strong><span>TODO → IN PROGRESS → DONE. BLOCKED wajib punya alasan, owner, dan next review.</span></div>
            <div><strong>Meeting</strong><span>Meeting FINAL wajib berisi ringkasan, keputusan, dan action item atau alasan kenapa tidak dibuat task.</span></div>
            <div><strong>Dokumen</strong><span>Gunakan kategori yang benar dan simpan hasil di program terkait. File client bersifat privat.</span></div>
            <div><strong>Keuangan</strong><span>Invoice terbit punya nomor unik. Pembayaran tidak dihapus; koreksi dilakukan lewat void dan alasan.</span></div>
            <div><strong>Pengeluaran</strong><span>Catat semua pengeluaran operasional dengan kategori, nominal, dan tanggal. Review bulanan wajib.</span></div>
          </div>
        </section>
      )}

      {/* Tab: Operasional */}
      {activeTab === "ops" && (
        <section className="guide-section">
          <div className="guide-section-heading"><div><span className="eyebrow">Operasional teknis</span><h2>Deploy, diagnosa, dan setelan server</h2></div><p>Panduan lengkap ada di docs/PANDUAN-OPERASIONAL.md.</p></div>

          <div className="guide-quick-grid" style={{ marginBottom: "1.75rem" }}>
            {deploySteps.map(([number, title, text]) => <article className="guide-quick-item" key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}
          </div>

          <div className="guide-section-heading"><div><span className="eyebrow">Diagnosa error</span><h2>Gejala, penyebab, dan tindakan</h2></div><p>Mulai dari gejala yang user laporkan.</p></div>
          <div className="guide-table-wrap"><table className="guide-table"><thead><tr><th>Gejala di log / laporan</th><th>Penyebab paling mungkin</th><th>Tindakan</th></tr></thead><tbody>{diagnosa.map((row) => <tr key={row[0]}><td><span className="guide-table-role">{row[0]}</span></td><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table></div>

          <div className="guide-section-heading" style={{ marginTop: "1.75rem" }}><div><span className="eyebrow">Setelan environment</span><h2>Kunci rahasia yang dibutuhkan aplikasi</h2></div><p>Dipasang di EasyPanel → shaff-app → Environment.</p></div>
          <div className="guide-table-wrap"><table className="guide-table"><thead><tr><th>Nama env</th><th>Fungsi</th><th>Status</th></tr></thead><tbody>{envStatus.map((row) => <tr key={row[0]}><td><span className="guide-table-role">{row[0]}</span></td><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table></div>

          <div className="guide-rules-grid" style={{ marginTop: "1.75rem" }}>
            <div><strong>Push belum berarti live</strong><span>Perubahan baru aktif setelah container dibangun ulang di EasyPanel.</span></div>
            <div><strong>Selalu build lokal dulu</strong><span>Kalau build lokal gagal, deploy di server pasti gagal juga — hemat waktu menunggu.</span></div>
            <div><strong>Jangan restart database</strong><span>Untuk memperbaiki masalah app, restart shaff-db tidak menolong dan berisiko.</span></div>
            <div><strong>Jangan ubah firewall global</strong><span>Aturan ufw global bisa memutus panel EasyPanel dan aplikasi lain di server yang sama.</span></div>
          </div>

          <p className="guide-note"><Icon name="spark" size={15} /> Cek kesehatan aplikasi: <code>curl -s https://shaff.gampangin.biz.id/api/health</code> harus mengembalikan status ok dan database ok.</p>
        </section>
      )}

      <section className="guide-footer-links"><span>Butuh langkah berikutnya?</span><Link href="/dashboard/clients">Kelola client <Icon name="arrowRight" size={14} /></Link><Link href="/dashboard/meetings">Catat meeting <Icon name="arrowRight" size={14} /></Link><Link href="/dashboard/invoices">Review invoice <Icon name="arrowRight" size={14} /></Link></section>
    </div>
  );
}
