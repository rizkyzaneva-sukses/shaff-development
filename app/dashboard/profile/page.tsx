"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Badge, FormField, Icon, PageHeader, inputClass } from "@/components/ops-ui";

type Me = { id: string; name: string; jobTitle: string | null; email: string; role: string };

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  LEAD: "Chief Executive Officer",
  CMO: "Chief Marketing Officer",
  COO: "Chief Operating Officer",
  FINANCE: "Chief Financial Officer",
};

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  useEffect(() => {
    apiFetch<{ user: Me }>("/api/auth/me")
      .then((payload) => setMe(payload.user))
      .catch(() => setMe(null));
  }, []);

  const tooShort = next.length > 0 && next.length < 12;
  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit = current.length > 0 && next.length >= 12 && next === confirm && !busy;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setDone("");
    if (next.length < 12) return setError("Password baru minimal 12 karakter.");
    if (next !== confirm) return setError("Konfirmasi password tidak sama.");
    if (next === current) return setError("Password baru harus berbeda dari password saat ini.");
    setBusy(true);
    try {
      await apiFetch<{ ok: boolean }>("/api/auth/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      setCurrent(""); setNext(""); setConfirm("");
      setDone("Password berhasil diubah. Sesi lain Anda sudah dikeluarkan.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Password gagal diubah");
    } finally {
      setBusy(false);
    }
  }

  if (!me) return <div className="ops-page"><div className="grid min-h-[420px] place-items-center text-sm text-[var(--muted)]">Memuat profil…</div></div>;

  return (
    <div className="ops-page page-enter">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-[#506545] hover:text-[#bf6d4e]">
        ← Ringkasan
      </Link>

      <div className="mt-5">
        <PageHeader eyebrow="Profil akun" title={me.name} description="Kelola kata sandi akun Anda. Perubahan nama, jabatan, dan role dilakukan oleh Administrator." />
      </div>

      <section className="mt-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <article className="surface p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#d7e3d2] text-sm font-bold text-[#506545]">
              {me.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="eyebrow">Identitas</p>
              <h2 className="mt-1 truncate text-lg font-semibold text-[#334035]">{me.name}</h2>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--muted)]">Email</dt>
              <dd className="truncate font-medium text-[#334035]">{me.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--muted)]">Jabatan</dt>
              <dd className="text-right font-medium text-[#334035]">{me.jobTitle || roleLabels[me.role] || me.role}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--muted)]">Hak akses</dt>
              <dd><Badge tone={me.role === "ADMIN" ? "sage" : me.role === "FINANCE" ? "terracotta" : "amber"}>{me.role}</Badge></dd>
            </div>
          </dl>
          <p className="mt-5 border-t border-[var(--border)] pt-4 text-xs leading-5 text-[var(--muted)]">
            Butuh mengubah data di atas? Hubungi Administrator workspace.
          </p>
        </article>

        <article className="surface p-5 sm:p-6">
          <div className="flex items-start gap-3 border-b border-[var(--border)] pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef3ec] text-[#506545]">
              <Icon name="target" size={17} />
            </span>
            <div>
              <p className="eyebrow">Keamanan</p>
              <h2 className="mt-1 text-lg font-semibold text-[#334035]">Ganti kata sandi</h2>
            </div>
          </div>

          <form className="mt-5 grid gap-4" onSubmit={submit}>
            <FormField label="Kata sandi saat ini">
              <input className={inputClass} type="password" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} required />
            </FormField>
            <FormField label="Kata sandi baru" hint="Minimal 12 karakter.">
              <input className={inputClass} type="password" autoComplete="new-password" minLength={12} value={next} onChange={(event) => setNext(event.target.value)} required />
            </FormField>
            <FormField label="Ulangi kata sandi baru">
              <input className={inputClass} type="password" autoComplete="new-password" minLength={12} value={confirm} onChange={(event) => setConfirm(event.target.value)} required />
            </FormField>

            {tooShort && <p className="text-xs text-[#bf6d4e]">Kata sandi baru minimal 12 karakter.</p>}
            {mismatch && <p className="text-xs text-[#bf6d4e]">Konfirmasi kata sandi tidak sama.</p>}
            {error && <p className="rounded-xl border border-[#e6c4b8] bg-[#fdf4f1] px-3 py-2 text-xs text-[#a1502f]" role="alert">{error}</p>}
            {done && <p className="rounded-xl border border-[#c9dbc4] bg-[#f3f8f1] px-3 py-2 text-xs text-[#506545]" role="status">{done}</p>}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button type="submit" disabled={!canSubmit} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#506545] px-4 text-xs font-semibold text-white transition hover:bg-[#43563a] disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? "Menyimpan…" : "Simpan kata sandi"}
              </button>
              <span className="text-[11px] leading-4 text-[var(--muted)]">
                Setelah tersimpan, semua sesi lain otomatis keluar.
              </span>
            </div>
          </form>
        </article>
      </section>
    </div>
  );
}
