"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Badge, FormField, Icon, PageHeader, TabButton, inputClass } from "@/components/ops-ui";

type Tab = "organization" | "team" | "audit";
type Role = "ADMIN" | "LEAD" | "MEMBER" | "FINANCE";
type Status = "ACTIVE" | "INACTIVE" | "ARCHIVED";
type Organization = { id: string; name: string; legalName: string | null; address: string | null; phone: string | null; email: string | null; logoUrl: string | null; bankName: string | null; bankAccountName: string | null; bankAccountNo: string | null };
type TeamUser = { id: string; name: string; jobTitle: string | null; email: string; role: Role; status: Status; lastLoginAt: string | null; createdAt: string };
type AuditLog = { id: string; action: string; objectType: string; objectId: string; changes: unknown; reason: string | null; createdAt: string; actor: { id: string; name: string; jobTitle: string | null; email: string } | null };

const emptyOrganization: Organization = { id: "organization", name: "", legalName: null, address: null, phone: null, email: null, logoUrl: null, bankName: null, bankAccountName: null, bankAccountNo: null };
const roleLabels: Record<Role, string> = { ADMIN: "Admin", LEAD: "Lead", MEMBER: "Member", FINANCE: "Finance" };
const statusLabels: Record<Status, string> = { ACTIVE: "Aktif", INACTIVE: "Nonaktif", ARCHIVED: "Arsip" };
const toneForRole = (role: Role) => role === "ADMIN" ? "sage" as const : role === "FINANCE" ? "terracotta" as const : role === "LEAD" ? "amber" as const : "slate" as const;
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SD";
const dateTime = (value: string | null) => value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Belum pernah";

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Permintaan gagal diproses");
  return payload as T;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("organization");
  const [organization, setOrganization] = useState<Organization>(emptyOrganization);
  const [team, setTeam] = useState<TeamUser[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditFilters, setAuditFilters] = useState({ q: "", action: "", objectType: "" });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [invite, setInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [editing, setEditing] = useState<TeamUser | null>(null);
  const [resetLink, setResetLink] = useState("");
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", jobTitle: "", role: "MEMBER" as Role });

  const notify = (message: string) => { setSaved(message); window.setTimeout(() => setSaved(""), 3500); };
  const reportError = (reason: unknown) => setError(reason instanceof Error ? reason.message : "Terjadi kesalahan");

  useEffect(() => {
    setLoading(true);
    void api<{ settings: Organization | null }>("/api/settings/organization").then(({ settings }) => { if (settings) setOrganization(settings); }).catch(reportError).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== "team") return;
    setLoading(true);
    void api<{ users: TeamUser[] }>("/api/settings/team").then(({ users }) => setTeam(users)).catch(reportError).finally(() => setLoading(false));
  }, [tab]);

  const loadAudit = (page = auditPage) => {
    setLoading(true);
    const query = new URLSearchParams({ page: String(page), pageSize: "20" });
    for (const [key, value] of Object.entries(auditFilters)) if (value.trim()) query.set(key, value.trim());
    void api<{ logs: AuditLog[]; pagination: { totalPages: number } }>(`/api/settings/audit?${query.toString()}`).then(({ logs, pagination }) => { setAudit(logs); setAuditPage(page); setAuditTotalPages(pagination.totalPages); }).catch(reportError).finally(() => setLoading(false));
  };

  // loadAudit intentionally reads the latest filter state when the audit tab opens.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === "audit") loadAudit(1); }, [tab]);

  const submitOrganization = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setLoading(true);
    try { const result = await api<{ settings: Organization }>("/api/settings/organization", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(organization) }); setOrganization(result.settings); notify("Profil organisasi disimpan"); }
    catch (reason) { reportError(reason); } finally { setLoading(false); }
  };

  const submitInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const result = await api<{ user: TeamUser; activationUrl: string }>("/api/auth/invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(inviteForm) });
      setInviteLink(`${window.location.origin}${result.activationUrl}`); setInviteForm({ name: "", email: "", jobTitle: "", role: "MEMBER" }); notify("Undangan dibuat; salin link aktivasi untuk anggota");
      const latest = await api<{ users: TeamUser[] }>("/api/settings/team"); setTeam(latest.users);
    } catch (reason) { reportError(reason); } finally { setLoading(false); }
  };

  const updateMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!editing) return; setError(""); setLoading(true);
    try { const result = await api<{ user: TeamUser }>(`/api/settings/team/${editing.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(editing) }); setTeam((current) => current.map((user) => user.id === result.user.id ? result.user : user)); setEditing(null); notify("Akses anggota diperbarui"); }
    catch (reason) { reportError(reason); } finally { setLoading(false); }
  };

  const toggleStatus = async (member: TeamUser) => {
    setError(""); setLoading(true);
    try { const result = await api<{ user: TeamUser }>(`/api/settings/team/${member.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }) }); setTeam((current) => current.map((user) => user.id === result.user.id ? result.user : user)); notify(result.user.status === "ACTIVE" ? "Anggota diaktifkan" : "Anggota dinonaktifkan"); }
    catch (reason) { reportError(reason); } finally { setLoading(false); }
  };

  const createResetLink = async (member: TeamUser) => {
    setError(""); setLoading(true);
    try { const result = await api<{ resetUrl: string }>("/api/auth/reset-link", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: member.id }) }); setResetLink(`${window.location.origin}${result.resetUrl}`); notify("Link reset password dibuat"); }
    catch (reason) { reportError(reason); } finally { setLoading(false); }
  };

  const canPrevious = auditPage > 1;
  const canNext = auditPage < auditTotalPages;
  const auditActions = useMemo(() => Array.from(new Set(audit.map((item) => item.action))), [audit]);

  return <div className="ops-page">
    <PageHeader eyebrow="Administrasi" title="Pengaturan" description="Kelola identitas Shaff Development, akses tim, dan jejak perubahan operasional." />
    <section className="mt-6 flex gap-5 overflow-x-auto border-b border-[var(--border)]"><TabButton active={tab === "organization"} onClick={() => setTab("organization")}>Profil organisasi</TabButton><TabButton active={tab === "team"} onClick={() => setTab("team")} count={team.length || undefined}>Anggota tim</TabButton><TabButton active={tab === "audit"} onClick={() => setTab("audit")}>Audit log</TabButton></section>
    {error && <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-[#efc7bf] bg-[#fff5f2] px-4 py-3 text-sm text-[#9d4936]" role="alert"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Tutup pesan">×</button></div>}
    {tab === "organization" && <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_340px]">
      <form className="surface p-5 sm:p-7" onSubmit={submitOrganization}><div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-5"><div><h2 className="text-sm font-semibold text-[#334035]">Identitas usaha</h2><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Informasi ini tampil di invoice dan dokumen resmi.</p></div><Badge tone="sage" dot>Aktif</Badge></div><div className="mt-6 grid gap-5"><div className="grid gap-5 sm:grid-cols-2"><FormField label="Nama usaha"><input className={inputClass} value={organization.name} onChange={(event) => setOrganization({ ...organization, name: event.target.value })} required /></FormField><FormField label="Nama legal"><input className={inputClass} value={organization.legalName ?? ""} onChange={(event) => setOrganization({ ...organization, legalName: event.target.value })} /></FormField></div><FormField label="Email utama"><input className={inputClass} type="email" value={organization.email ?? ""} onChange={(event) => setOrganization({ ...organization, email: event.target.value })} /></FormField><FormField label="Alamat"><textarea className="min-h-24 w-full rounded-xl border border-[var(--border)] bg-[#fbfcfa] p-3 text-sm text-[#263328] outline-none transition focus:border-[#738b69] focus:ring-2 focus:ring-[#738b69]/15" value={organization.address ?? ""} onChange={(event) => setOrganization({ ...organization, address: event.target.value })} /></FormField><FormField label="Nomor telepon"><input className={inputClass} value={organization.phone ?? ""} onChange={(event) => setOrganization({ ...organization, phone: event.target.value })} /></FormField></div><div className="mt-7 flex justify-end border-t border-[var(--border)] pt-5"><button disabled={loading} type="submit" className="min-h-11 rounded-xl bg-[#506545] px-5 text-sm font-semibold text-white transition hover:bg-[#425638] disabled:cursor-wait disabled:opacity-60">{loading ? "Menyimpan…" : "Simpan perubahan"}</button></div></form>
      <aside className="grid content-start gap-5"><div className="surface p-5"><h2 className="text-sm font-semibold text-[#334035]">Logo organisasi</h2><p className="mt-1 text-xs leading-5 text-[var(--muted)]">URL logo privat dapat disimpan untuk kebutuhan invoice.</p><div className="mt-5 flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#506545] text-lg font-bold tracking-[-0.08em] text-white">SD</span><input className={inputClass} placeholder="https://..." value={organization.logoUrl ?? ""} onChange={(event) => setOrganization({ ...organization, logoUrl: event.target.value })} aria-label="URL logo" /></div></div><div className="surface p-5"><h2 className="text-sm font-semibold text-[#334035]">Rekening pembayaran</h2><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Ditampilkan di bagian bawah invoice.</p><div className="mt-5 grid gap-3"><FormField label="Bank"><input className={inputClass} value={organization.bankName ?? ""} onChange={(event) => setOrganization({ ...organization, bankName: event.target.value })} /></FormField><FormField label="Nomor rekening"><input className={inputClass} value={organization.bankAccountNo ?? ""} onChange={(event) => setOrganization({ ...organization, bankAccountNo: event.target.value })} /></FormField><FormField label="Atas nama"><input className={inputClass} value={organization.bankAccountName ?? ""} onChange={(event) => setOrganization({ ...organization, bankAccountName: event.target.value })} /></FormField></div></div></aside>
    </div>}
    {tab === "team" && <section className="surface mt-6 p-5 sm:p-7"><div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-center"><div><h2 className="text-sm font-semibold text-[#334035]">Anggota tim</h2><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Atur peran, jabatan, status, dan ruang lingkup akses setiap anggota.</p></div><button type="button" onClick={() => { setInvite(true); setInviteLink(""); }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#bf6d4e] px-3.5 text-xs font-semibold text-white hover:bg-[#a95f42]"><Icon name="plus" size={15} />Undang anggota</button></div><div className="mt-2 divide-y divide-[var(--border)]">{team.map((member) => <div key={member.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e3e8e3] text-xs font-bold text-[#5d665e]">{initials(member.name)}</span><div><p className="text-sm font-semibold text-[#334035]">{member.name} {member.jobTitle && <span className="font-normal text-[var(--muted)]">· {member.jobTitle}</span>}</p><p className="mt-1 text-xs text-[var(--muted)]">{member.email} · login {dateTime(member.lastLoginAt)}</p></div></div><div className="flex flex-wrap items-center gap-2 lg:pr-1"><Badge tone={toneForRole(member.role)}>{roleLabels[member.role]}</Badge><Badge tone={member.status === "ACTIVE" ? "sage" : "red"} dot>{statusLabels[member.status]}</Badge><button type="button" onClick={() => setEditing(member)} className="min-h-9 rounded-lg border border-[var(--border)] px-3 text-xs font-semibold text-[#506545] hover:bg-[#eef3ec]">Edit</button><button type="button" onClick={() => void toggleStatus(member)} className="min-h-9 rounded-lg border border-[var(--border)] px-3 text-xs font-semibold text-[var(--muted)] hover:bg-[#f0f2f0]">{member.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}</button><button type="button" onClick={() => void createResetLink(member)} className="min-h-9 rounded-lg border border-[var(--border)] px-3 text-xs font-semibold text-[var(--muted)] hover:bg-[#f0f2f0]">Reset password</button></div></div>)}</div>{!team.length && !loading && <p className="py-10 text-center text-sm text-[var(--muted)]">Data anggota tidak tersedia atau Anda tidak memiliki akses admin.</p>}</section>}
    {tab === "audit" && <section className="surface mt-6 p-5 sm:p-7"><div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end"><div><h2 className="text-sm font-semibold text-[#334035]">Audit log</h2><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Riwayat perubahan penting dalam ruang kerja. Data hanya dapat dibaca oleh Admin.</p></div><button type="button" onClick={() => loadAudit(1)} className="min-h-10 rounded-xl border border-[var(--border)] px-3 text-xs font-semibold text-[#506545] hover:bg-[#eef3ec]">Muat ulang</button></div><div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"><input className={inputClass} placeholder="Cari aksi atau objek" value={auditFilters.q} onChange={(event) => setAuditFilters({ ...auditFilters, q: event.target.value })} /><input className={inputClass} placeholder="Filter action" list="audit-actions" value={auditFilters.action} onChange={(event) => setAuditFilters({ ...auditFilters, action: event.target.value })} /><input className={inputClass} placeholder="Filter object type" value={auditFilters.objectType} onChange={(event) => setAuditFilters({ ...auditFilters, objectType: event.target.value })} /><button type="button" onClick={() => loadAudit(1)} className="min-h-11 rounded-xl bg-[#506545] px-4 text-xs font-semibold text-white hover:bg-[#425638]">Terapkan</button><datalist id="audit-actions">{auditActions.map((action) => <option key={action} value={action} />)}</datalist></div><div className="mt-2 divide-y divide-[var(--border)]">{audit.map((item) => <div key={item.id} className="flex items-start gap-3 py-4"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eef3ec] text-[#506545]"><Icon name="check" size={14} /></span><div className="min-w-0"><p className="text-sm text-[#4b584d]"><strong className="font-semibold text-[#334035]">{item.actor?.name ?? "Sistem"}</strong> · {item.action} · {item.objectType} <span className="font-mono text-xs text-[var(--muted)]">{item.objectId}</span></p><p className="mt-1 text-xs text-[var(--muted)]">{dateTime(item.createdAt)}{item.reason ? ` · ${item.reason}` : ""}</p>{item.changes !== null && item.changes !== undefined && <details className="mt-2 text-xs text-[var(--muted)]"><summary className="cursor-pointer font-medium text-[#506545]">Lihat perubahan</summary><pre className="mt-2 max-w-full overflow-auto rounded-lg bg-[#f5f7f4] p-3 text-[10px] leading-4">{JSON.stringify(item.changes, null, 2) ?? ""}</pre></details>}</div></div>)}{!audit.length && !loading && <p className="py-10 text-center text-sm text-[var(--muted)]">Tidak ada audit log yang cocok.</p>}</div><div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4"><p className="text-xs text-[var(--muted)]">Halaman {auditPage} dari {auditTotalPages}</p><div className="flex gap-2"><button type="button" disabled={!canPrevious || loading} onClick={() => loadAudit(auditPage - 1)} className="min-h-9 rounded-lg border border-[var(--border)] px-3 text-xs font-semibold text-[#506545] disabled:cursor-not-allowed disabled:opacity-40">Sebelumnya</button><button type="button" disabled={!canNext || loading} onClick={() => loadAudit(auditPage + 1)} className="min-h-9 rounded-lg border border-[var(--border)] px-3 text-xs font-semibold text-[#506545] disabled:cursor-not-allowed disabled:opacity-40">Berikutnya</button></div></div></section>}
    {invite && <div className="fixed inset-0 z-50 grid place-items-center bg-[#283529]/30 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between"><div><p className="eyebrow">Anggota baru</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#334035]">Undang ke ruang kerja</h2></div><button type="button" onClick={() => setInvite(false)} className="grid h-9 w-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[#f0f2f0]" aria-label="Tutup"><span className="text-xl leading-none">×</span></button></div><form className="mt-6 grid gap-4" onSubmit={submitInvite}><FormField label="Nama anggota"><input className={inputClass} value={inviteForm.name} onChange={(event) => setInviteForm({ ...inviteForm, name: event.target.value })} required /></FormField><FormField label="Email anggota"><input className={inputClass} type="email" value={inviteForm.email} onChange={(event) => setInviteForm({ ...inviteForm, email: event.target.value })} required placeholder="nama@shaff.dev" /></FormField><FormField label="Jabatan"><input className={inputClass} value={inviteForm.jobTitle} onChange={(event) => setInviteForm({ ...inviteForm, jobTitle: event.target.value })} placeholder="Pendamping" /></FormField><FormField label="Peran"><select className={inputClass} value={inviteForm.role} onChange={(event) => setInviteForm({ ...inviteForm, role: event.target.value as Role })}><option value="MEMBER">Member</option><option value="LEAD">Lead</option><option value="FINANCE">Finance</option><option value="ADMIN">Admin</option></select></FormField>{inviteLink && <div className="rounded-xl border border-[#c9dbc4] bg-[#f3f8f1] p-3 text-xs text-[#506545]"><p className="font-semibold">Link aktivasi (tampilkan sekali)</p><input readOnly className={`${inputClass} mt-2 bg-white text-[11px]`} value={inviteLink} onFocus={(event) => event.currentTarget.select()} /></div>}<div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setInvite(false)} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-[var(--muted)] hover:bg-[#f0f2f0]">Tutup</button><button disabled={loading} type="submit" className="min-h-11 rounded-xl bg-[#bf6d4e] px-4 text-sm font-semibold text-white hover:bg-[#a95f42] disabled:opacity-60">Kirim undangan</button></div></form></div></div>}
    {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-[#283529]/30 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true"><form className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl sm:p-7" onSubmit={updateMember}><div className="flex items-start justify-between"><div><p className="eyebrow">Akses tim</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#334035]">Edit anggota</h2></div><button type="button" onClick={() => setEditing(null)} className="grid h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[#f0f2f0]" aria-label="Tutup"><span className="text-xl leading-none">×</span></button></div><div className="mt-6 grid gap-4"><FormField label="Nama"><input className={inputClass} value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} required /></FormField><FormField label="Jabatan"><input className={inputClass} value={editing.jobTitle ?? ""} onChange={(event) => setEditing({ ...editing, jobTitle: event.target.value })} /></FormField><FormField label="Peran"><select className={inputClass} value={editing.role} onChange={(event) => setEditing({ ...editing, role: event.target.value as Role })}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormField><FormField label="Status"><select className={inputClass} value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as Status })}><option value="ACTIVE">Aktif</option><option value="INACTIVE">Nonaktif</option></select></FormField></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-[var(--muted)] hover:bg-[#f0f2f0]">Batal</button><button disabled={loading} type="submit" className="min-h-11 rounded-xl bg-[#506545] px-4 text-sm font-semibold text-white hover:bg-[#425638] disabled:opacity-60">Simpan</button></div></form></div>}
    {resetLink && <div className="fixed bottom-5 left-1/2 z-[60] w-[min(90vw,640px)] -translate-x-1/2 rounded-xl border border-[#c9dbc4] bg-[#f3f8f1] px-4 py-3 text-sm text-[#506545] shadow-lg" role="status"><div className="flex items-center gap-3"><span className="min-w-0 flex-1"><strong>Link reset password:</strong> <input readOnly className="mt-2 w-full rounded-lg border border-[#c9dbc4] bg-white px-2 py-1 text-xs" value={resetLink} onFocus={(event) => event.currentTarget.select()} /></span><button type="button" onClick={() => setResetLink("")} aria-label="Tutup">×</button></div></div>}
    {saved && <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-[#334035] px-4 py-3 text-sm font-medium text-white shadow-lg" role="status">{saved}</div>}
  </div>;
}
