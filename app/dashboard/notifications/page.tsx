"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Icon } from "@/components/icons"

type NotificationData = {
  generatedAt: string
  overdueTasks: Array<{ id: string; title: string; dueDate: string; programId: string; programName: string; clientName: string; assigneeName: string }>
  upcomingMeetings: Array<{ id: string; title: string; meetingAt: string; client: { businessName: string }; program: { id: string; name: string } }>
  overdueInvoices: Array<{ id: string; invoiceNumber: string | null; dueDate: string; balance: number; client: { businessName: string }; program: { name: string } }>
  programHealth: Array<{ id: string; name: string; clientName: string; risk: string; healthScore: number | null; riskNote: string | null; targetDate: string; overdueTaskCount: number }>
  counts: { overdueTasks: number; upcomingMeetings: number; overdueInvoices: number; programHealth: number }
}

const emptyData: NotificationData = { generatedAt: "", overdueTasks: [], upcomingMeetings: [], overdueInvoices: [], programHealth: [], counts: { overdueTasks: 0, upcomingMeetings: 0, overdueInvoices: 0, programHealth: 0 } }
const dateLabel = (value: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value)
const riskLabel: Record<string, string> = { HEALTHY: "Sehat", ATTENTION: "Perlu perhatian", CRITICAL: "Kritis" }
const riskClass: Record<string, string> = { HEALTHY: "pill-active", ATTENTION: "pill-hold", CRITICAL: "pill-archived" }

export default function NotificationsPage() {
  const [data, setData] = useState<NotificationData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  useEffect(() => { fetch("/api/notifications", { cache: "no-store" }).then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Notifikasi gagal dimuat"); setData(payload) }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Notifikasi gagal dimuat")).finally(() => setLoading(false)) }, [])

  const total = Object.values(data.counts).reduce((sum, count) => sum + count, 0)
  return <div className="page-enter">
    <div className="section-header"><div><span className="eyebrow">Ritme operasional</span><h1>Notifikasi &amp; health</h1><p>Daftar tindakan yang perlu direspons tim agar pekerjaan dan cashflow tidak terlewat.</p></div><div className="section-actions"><a className="button button-quiet" href="/api/export/program-health"><Icon name="download" size={15} /> Export health CSV</a><a className="button button-quiet" href="/api/export/program-health?format=excel">Export health Excel</a><button className="button button-quiet" onClick={() => window.print()}>Cetak / PDF</button><button className="button button-primary" onClick={() => { setLoading(true); window.location.reload() }}><Icon name="refresh" size={15} /> Segarkan</button></div></div>
    {error && <div className="login-error" role="alert">{error}</div>}
    <section className="notification-summary"><div><strong>{loading ? "…" : total}</strong><span>item perlu ditinjau</span></div><div><strong>{data.counts.overdueTasks}</strong><span>task overdue</span></div><div><strong>{data.counts.upcomingMeetings}</strong><span>meeting 7 hari</span></div><div><strong>{data.counts.overdueInvoices}</strong><span>invoice overdue</span></div><div><strong>{data.counts.programHealth}</strong><span>program berisiko</span></div></section>
    <div className="notification-grid">
      <section className="panel notification-panel"><div className="panel-heading"><div><span className="eyebrow">Follow-up segera</span><h2>Task overdue</h2></div><span className="status-pill pill-archived">{data.counts.overdueTasks}</span></div>{data.overdueTasks.length === 0 ? <p className="detail-copy">Tidak ada task overdue dalam scope Anda.</p> : <div className="notification-list">{data.overdueTasks.map((item) => <Link href={`/dashboard/tasks/${item.id}`} className="notification-row" key={item.id}><span className="notification-dot notification-dot-coral" /><div><strong>{item.title}</strong><span>{item.clientName} · {item.programName}</span><small>Deadline {dateLabel(item.dueDate)} · {item.assigneeName}</small></div><Icon name="chevron" size={14} /></Link>)}</div>}</section>
      <section className="panel notification-panel"><div className="panel-heading"><div><span className="eyebrow">Agenda berikutnya</span><h2>Meeting 7 hari</h2></div><span className="status-pill pill-active">{data.counts.upcomingMeetings}</span></div>{data.upcomingMeetings.length === 0 ? <p className="detail-copy">Belum ada meeting dalam 7 hari ke depan.</p> : <div className="notification-list">{data.upcomingMeetings.map((item) => <Link href="/dashboard/meetings" className="notification-row" key={item.id}><span className="notification-dot notification-dot-teal" /><div><strong>{item.title}</strong><span>{item.client.businessName} · {item.program.name}</span><small>{dateLabel(item.meetingAt)}</small></div><Icon name="chevron" size={14} /></Link>)}</div>}</section>
      <section className="panel notification-panel"><div className="panel-heading"><div><span className="eyebrow">Cashflow</span><h2>Invoice overdue</h2></div><span className="status-pill pill-hold">{data.counts.overdueInvoices}</span></div>{data.overdueInvoices.length === 0 ? <p className="detail-copy">Tidak ada piutang jatuh tempo yang belum lunas.</p> : <div className="notification-list">{data.overdueInvoices.map((item) => <Link href="/dashboard/invoices" className="notification-row" key={item.id}><span className="notification-dot notification-dot-amber" /><div><strong>{item.invoiceNumber || "Draft invoice"}</strong><span>{item.client.businessName} · {item.program.name}</span><small>Jatuh tempo {dateLabel(item.dueDate)} · {money(item.balance)}</small></div><Icon name="chevron" size={14} /></Link>)}</div>}</section>
      <section className="panel notification-panel"><div className="panel-heading"><div><span className="eyebrow">Review mingguan</span><h2>Health program</h2></div><span className="status-pill pill-archived">{data.counts.programHealth}</span></div>{data.programHealth.length === 0 ? <p className="detail-copy">Semua program dalam scope Anda berstatus sehat.</p> : <div className="notification-list">{data.programHealth.map((item) => <Link href={`/dashboard/programs/${item.id}`} className="notification-row" key={item.id}><span className={`notification-dot ${item.risk === "CRITICAL" ? "notification-dot-coral" : "notification-dot-amber"}`} /><div><strong>{item.name}</strong><span>{item.clientName} · target {dateLabel(item.targetDate)}</span><small><span className={`status-pill ${riskClass[item.risk] || "pill-hold"}`}>{riskLabel[item.risk] || item.risk}</span>{item.healthScore !== null ? ` · score ${item.healthScore}/100` : ""}{item.overdueTaskCount ? ` · ${item.overdueTaskCount} task overdue` : ""}</small>{item.riskNote && <small>{item.riskNote}</small>}</div><Icon name="chevron" size={14} /></Link>)}</div>}</section>
    </div>
    <p className="notification-footnote">Terakhir diperbarui {data.generatedAt ? dateLabel(data.generatedAt) : "—"}. Reminder ini bersifat in-app dan mengikuti scope akses akun Anda.</p>
  </div>
}
