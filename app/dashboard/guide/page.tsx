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

const roles = [
  { title: "CEO", tone: "coral", rhythm: "Senin pagi · 30 menit", focus: "Arah dan keputusan", actions: ["Buka Ringkasan dan lihat kesehatan portofolio.", "Tinjau program overdue atau BLOCKED.", "Ambil keputusan pada isu yang dieskalasikan COO.", "Pantau snapshot piutang tanpa mengubah catatan operasional."] },
  { title: "COO", tone: "teal", rhythm: "Harian · 10–15 menit", focus: "Ritme eksekusi", actions: ["Triage task overdue dan BLOCKED.", "Pastikan setiap program punya PIC dan next action.", "Review catatan meeting yang belum FINAL.", "Jalankan review mingguan dan minta owner memperbarui data."] },
  { title: "CMO", tone: "violet", rhythm: "Mingguan per client", focus: "Kualitas pendampingan", actions: ["Baca konteks client dan objective program.", "Review progress, deliverable, dan feedback konsultasi.", "Catat insight kebutuhan client sebagai action item.", "Koordinasikan narasi hasil dengan COO sebelum dibagikan keluar."] },
  { title: "CTO", tone: "blue", rhythm: "Mingguan · 30 menit", focus: "Sistem dan keamanan", actions: ["Pastikan akses sesuai peran dan akun aktif.", "Review dokumen digitalisasi dan data yang masih kosong.", "Cek kesehatan deployment, backup, dan error log.", "Eskalasi celah keamanan atau kebutuhan integrasi ke COO."] },
  { title: "CFO", tone: "amber", rhythm: "Harian · 10 menit", focus: "Invoice dan arus kas", actions: ["Buka Invoice dan cek jatuh tempo.", "Terbitkan invoice hanya setelah scope dan nominal disetujui.", "Catat pembayaran dengan nominal, metode, referensi, dan bukti.", "Gunakan void dengan alasan jika ada koreksi; jangan hapus transaksi."] },
];

const matrix = [
  ["CEO", "Penuh", "Penuh", "Review", "Review", "Ringkasan"],
  ["COO", "Penuh", "Penuh", "Penuh", "Penuh", "Operasional"],
  ["CMO", "Scope client", "Scope program", "Review", "Review", "Tidak perlu"],
  ["CTO", "Anggota", "Anggota", "PIC", "Upload", "Tidak perlu"],
  ["CFO", "Ringkasan", "Ringkasan", "Review", "Bukti bayar", "Penuh"],
];

type Tab = "quickstart" | "workflow" | "roles" | "permissions" | "rules";
const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: "quickstart", label: "Mulai Cepat", icon: "clock" },
  { key: "workflow", label: "Workflow", icon: "layers" },
  { key: "roles", label: "Per Role", icon: "users" },
  { key: "permissions", label: "Akses", icon: "shield" },
  { key: "rules", label: "Aturan", icon: "target" },
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
              ["05", "Review dan eskalasi", "Jika BLOCKED, isi alasan dan pihak yang dibutuhkan. Eskalasi ke COO, bukan diamkan."],
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

      {/* Tab: Roles */}
      {activeTab === "roles" && (
        <section className="guide-section">
          <div className="guide-section-heading"><div><span className="eyebrow">Quick start per role</span><h2>Yang perlu dibuka oleh tiap pemimpin</h2></div><p>Pilih ritme, lalu tinggalkan jejak keputusan di workspace.</p></div>
          <div className="guide-role-grid">
            {roles.map((role) => <article className={`guide-role-card guide-role-${role.tone}`} key={role.title}><div className="guide-role-head"><span className="guide-role-avatar">{role.title[0]}</span><div><h3>{role.title}</h3><span>{role.focus}</span></div></div><div className="guide-role-rhythm"><Icon name="calendar" size={14} /> {role.rhythm}</div><ul>{role.actions.map((action) => <li key={action}><Icon name="check" size={14} /> <span>{action}</span></li>)}</ul></article>)}
          </div>
        </section>
      )}

      {/* Tab: Permissions */}
      {activeTab === "permissions" && (
        <section className="guide-section guide-permission-section">
          <div className="guide-section-heading"><div><span className="eyebrow">Permission map</span><h2>Peran menentukan ruang kerja</h2></div><p>Admin mengelola workspace; akses data client mengikuti assignment.</p></div>
          <div className="guide-table-wrap"><table className="guide-table"><thead><tr><th>Role</th><th>Client</th><th>Program</th><th>Task</th><th>Meeting / dokumen</th><th>Invoice</th></tr></thead><tbody>{matrix.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}><span className={index === 0 ? "guide-table-role" : undefined}>{cell}</span></td>)}</tr>)}</tbody></table></div>
          <p className="guide-note"><Icon name="spark" size={15} /> Untuk CMO, CTO, dan anggota pendampingan, minta COO menambahkan user ke program agar scope kerja terbaca sesuai assignment.</p>
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

      <section className="guide-footer-links"><span>Butuh langkah berikutnya?</span><Link href="/dashboard/clients">Kelola client <Icon name="arrowRight" size={14} /></Link><Link href="/dashboard/meetings">Catat meeting <Icon name="arrowRight" size={14} /></Link><Link href="/dashboard/invoices">Review invoice <Icon name="arrowRight" size={14} /></Link></section>
    </div>
  );
}
