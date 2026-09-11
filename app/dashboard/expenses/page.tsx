"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { Badge, EmptyState, FormField, Icon, MetricCard, PageHeader, SearchField, TabButton, inputClass } from "@/components/ops-ui";

type Expense = { id: string; category: string; description: string; amount: number; expenseDate: string; notes?: string | null; createdBy: { id: string; name: string; email: string }; createdAt: string };
const idr = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const categoryLabel: Record<string, string> = { GAJI: "Gaji", SEWA: "Sewa", TOOLS_SOFTWARE: "Tools/Software", TRANSPORT: "Transport", OPERASIONAL: "Operasional", MARKETING: "Marketing", LAINNYA: "Lainnya" };
const categoryTone: Record<string, string> = { GAJI: "terracotta", SEWA: "amber", TOOLS_SOFTWARE: "sage", TRANSPORT: "slate", OPERASIONAL: "slate", MARKETING: "red", LAINNYA: "slate" };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]); const [query, setQuery] = useState(""); const [tab, setTab] = useState<"all" | string>("all"); const [showForm, setShowForm] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [toast, setToast] = useState("");
  const load = async () => { setLoading(true); setError(""); try { const res = await fetch("/api/expenses", { cache: "no-store" }); if (!res.ok) throw new Error("Data pengeluaran tidak dapat dimuat"); const data = await res.json(); setExpenses(data.expenses ?? []); } catch (e) { setError(e instanceof Error ? e.message : "Data tidak dapat dimuat"); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2800); };
  const categories = useMemo(() => Array.from(new Set(expenses.map(e => e.category))), [expenses]);
  const filtered = useMemo(() => expenses.filter(e => {
    const text = [e.description, e.notes, categoryLabel[e.category], e.createdBy.name].join(" ").toLowerCase();
    return text.includes(query.toLowerCase()) && (tab === "all" || e.category === tab);
  }), [expenses, query, tab]);
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
  const thisMonth = expenses.filter(e => { const d = new Date(e.expenseDate); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s, e) => s + e.amount, 0);
  const byCategory = useMemo(() => { const map: Record<string, number> = {}; expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; }); return Object.entries(map).sort((a, b) => b[1] - a[1]); }, [expenses]);

  const createExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const res = await fetch("/api/expenses", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ category: form.get("category"), description: form.get("description"), amount: Number(form.get("amount")), expenseDate: form.get("expenseDate"), notes: form.get("notes") }) });
    const payload = await res.json().catch(() => ({})); if (!res.ok) return notify(payload.error ?? "Gagal menyimpan pengeluaran");
    setShowForm(false); notify("Pengeluaran tersimpan"); await load();
  };

  return <div className="ops-page">
    <PageHeader eyebrow="Keuangan" title="Pengeluaran operasional" description="Catat dan pantau pengeluaran internal perusahaan." action={() => setShowForm(true)} actionLabel="Tambah pengeluaran" />
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Total pengeluaran" value={idr(totalAll)} detail="semua waktu" tone="terracotta" icon="payment" />
      <MetricCard label="Bulan ini" value={idr(thisMonth)} detail={new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })} tone="amber" icon="calendar" />
      <MetricCard label="Jumlah transaksi" value={String(expenses.length)} detail="catatan" tone="sage" icon="file" />
      <MetricCard label="Kategori terbesar" value={byCategory[0] ? categoryLabel[byCategory[0][0]] || byCategory[0][0] : "-"} detail={byCategory[0] ? idr(byCategory[0][1]) : "belum ada data"} tone="violet" icon="tag" />
    </section>
    <section className="surface mt-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-5 overflow-x-auto border-b border-[var(--border)] lg:border-0">
          <TabButton active={tab === "all"} onClick={() => setTab("all")} count={expenses.length}>Semua</TabButton>
          {categories.map(cat => <TabButton key={cat} active={tab === cat} onClick={() => setTab(cat)} count={expenses.filter(e => e.category === cat).length}>{categoryLabel[cat] || cat}</TabButton>)}
        </div>
        <SearchField value={query} onChange={setQuery} placeholder="Cari pengeluaran..." />
      </div>
      {loading ? <div className="empty-state mt-5"><Icon name="clock" size={22} /><strong>Memuat data...</strong></div>
        : error ? <div className="empty-state mt-5"><strong>Error</strong><span>{error}</span><button className="button button-quiet" onClick={() => void load()}>Coba lagi</button></div>
        : <div className="mt-5 overflow-x-auto">{filtered.length === 0 ? <EmptyState icon="payment" title="Belum ada pengeluaran" description="Tambah pengeluaran pertama Anda." /> :
          <table className="w-full min-w-[700px] text-left">
            <thead><tr className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]"><th className="border-b border-[var(--border)] px-3 pb-3">Tanggal</th><th className="border-b border-[var(--border)] px-3 pb-3">Kategori</th><th className="border-b border-[var(--border)] px-3 pb-3">Deskripsi</th><th className="border-b border-[var(--border)] px-3 pb-3">Nominal</th><th className="border-b border-[var(--border)] px-3 pb-3">Dicatat oleh</th></tr></thead>
            <tbody>{filtered.map(e => <tr key={e.id} className="text-sm hover:bg-[#fbfcfa]">
              <td className="border-b border-[var(--border)] px-3 py-3 text-[var(--muted)]">{new Date(e.expenseDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>
              <td className="border-b border-[var(--border)] px-3 py-3"><Badge tone={categoryTone[e.category] as "sage" | "terracotta" | "amber" | "slate" | "red" || "slate"}>{categoryLabel[e.category] || e.category}</Badge></td>
              <td className="border-b border-[var(--border)] px-3 py-3"><strong className="font-medium">{e.description}</strong>{e.notes && <span className="block text-xs text-[var(--muted)] mt-0.5">{e.notes}</span>}</td>
              <td className="border-b border-[var(--border)] px-3 py-3 font-medium">{idr(e.amount)}</td>
              <td className="border-b border-[var(--border)] px-3 py-3 text-[var(--muted)]">{e.createdBy.name}</td>
            </tr>)}</tbody>
          </table>}</div>}
    </section>
    {showForm && <div className="fixed inset-0 z-50 grid place-items-center bg-[#283529]/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between"><div><p className="eyebrow">Pengeluaran baru</p><h2 className="mt-1 text-xl font-semibold text-[#334035]">Catat pengeluaran</h2></div><button type="button" onClick={() => setShowForm(false)} aria-label="Tutup">×</button></div>
        <form className="mt-6 grid gap-4" onSubmit={createExpense}>
          <FormField label="Kategori"><select name="category" className={inputClass} required defaultValue=""><option value="" disabled>Pilih kategori</option>{Object.entries(categoryLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></FormField>
          <FormField label="Deskripsi"><input name="description" className={inputClass} required placeholder="Contoh: Sewa kantor bulan September" /></FormField>
          <div className="grid gap-4 sm:grid-cols-2"><FormField label="Nominal (Rp)"><input name="amount" type="number" min="1" className={inputClass} required /></FormField><FormField label="Tanggal"><input name="expenseDate" type="date" className={inputClass} required defaultValue={new Date().toISOString().slice(0, 10)} /></FormField></div>
          <FormField label="Catatan"><input name="notes" className={inputClass} placeholder="Opsional" /></FormField>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="button button-quiet">Batal</button><button className="button button-primary">Simpan</button></div>
        </form>
      </div>
    </div>}
    {toast && <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-[#334035] px-4 py-3 text-sm font-medium text-white shadow-lg" role="status">{toast}</div>}
  </div>;
}
