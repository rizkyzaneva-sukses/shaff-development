"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "sage" | "terracotta" | "amber" | "slate" | "red";

const toneClasses: Record<Tone, string> = {
  sage: "bg-[#eef3ec] text-[#506545]",
  terracotta: "bg-[#fbede8] text-[#a45338]",
  amber: "bg-[#fff6df] text-[#8d681e]",
  slate: "bg-[#f0f2f0] text-[#5d665e]",
  red: "bg-[#fae9e7] text-[#a5423a]"
};

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true
  };

  const paths: Record<string, ReactNode> = {
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    calendar: <><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M16 2.8v3.4M8 2.8v3.4M3 9h18" /></>,
    file: <><path d="M14 2.8H6.5A1.5 1.5 0 0 0 5 4.3v15.4a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V9Z" /><path d="M14 2.8V9h6M8 13h8M8 16.5h6" /></>,
    receipt: <><path d="M6 3.2h12v17.6l-2.2-1.5-1.8 1.5-2-1.5-2 1.5-1.8-1.5L6 20.8Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
    settings: <><path d="M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2Z" /><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3.1 1.3v.2a1.8 1.8 0 0 1-3.6 0v-.2A1.8 1.8 0 0 0 7 17.5l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1A1.8 1.8 0 0 0 3.2 12a1.8 1.8 0 0 1 1.3-3.1h.2A1.8 1.8 0 0 0 6 5.8l-.1-.1a1.8 1.8 0 0 1 2.5-2.5l.1.1A1.8 1.8 0 0 0 12 2.2a1.8 1.8 0 0 1 3.1 1.3v.2a1.8 1.8 0 0 0 3.1 1.8l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1A1.8 1.8 0 0 0 22 12a1.8 1.8 0 0 1-1.3 3.1h-.2a1.8 1.8 0 0 0-1.1-.1Z" /></>,
    dots: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    arrow: <><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.2 2" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 20h14" /></>,
    upload: <><path d="M12 15V3" /><path d="m7 8 5-5 5 5" /><path d="M5 20h14" /></>,
    users: <><path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" /><circle cx="10" cy="7.5" r="3" /><path d="M16.5 9a3 3 0 0 1 0 5.8M19.5 19v-1.5a3.5 3.5 0 0 0-2-3.2" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    external: <><path d="M14 5h5v5M19 5l-8 8" /><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>
  };

  return <svg {...common}>{paths[name] ?? paths.dots}</svg>;
}

export function Badge({ children, tone = "slate", dot = false }: { children: ReactNode; tone?: Tone; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em] ${toneClasses[tone]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function MetricCard({ label, value, detail, tone = "sage", icon }: { label: string; value: string; detail: string; tone?: Tone; icon?: string }) {
  return (
    <div className="surface flex min-h-[126px] flex-col justify-between p-5 shadow-[0_3px_14px_rgba(35,57,38,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
        {icon && <span className={`grid h-8 w-8 place-items-center rounded-xl ${toneClasses[tone]}`}><Icon name={icon} size={16} /></span>}
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="text-[27px] font-semibold tracking-[-0.04em] text-[#263328]">{value}</p>
        <p className="mb-1 text-right text-xs font-medium text-[var(--muted)]">{detail}</p>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action, actionLabel, actionIcon = "plus" }: { eyebrow: string; title: string; description: string; action?: () => void; actionLabel?: string; actionIcon?: string }) {
  return (
    <div className="flex flex-col justify-between gap-5 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-[clamp(1.65rem,3vw,2.35rem)] font-semibold tracking-[-0.045em] text-[#263328]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
      {action && actionLabel && (
        <button type="button" onClick={action} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#bf6d4e] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(191,109,78,0.2)] transition hover:-translate-y-0.5 hover:bg-[#a95f42] focus:outline-none focus:ring-2 focus:ring-[#bf6d4e]/40 focus:ring-offset-2">
          <Icon name={actionIcon} size={16} />{actionLabel}
        </button>
      )}
    </div>
  );
}

export function SearchField({ placeholder = "Cari...", value, onChange }: { placeholder?: string; value?: string; onChange?: (value: string) => void }) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">{placeholder}</span>
      <span className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-[var(--muted)]"><Icon name="search" size={17} /></span>
      <input value={value} onChange={(event) => onChange?.(event.target.value)} className="h-11 w-full rounded-xl border border-[var(--border)] bg-[#fbfcfa] pl-10 pr-3 text-sm text-[#263328] outline-none transition placeholder:text-[#9aa39a] focus:border-[#738b69] focus:ring-2 focus:ring-[#738b69]/15" placeholder={placeholder} />
    </label>
  );
}

export function EmptyState({ icon = "file", title, description, actionLabel, onAction }: { icon?: string; title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="grid min-h-[230px] place-items-center rounded-2xl border border-dashed border-[#d6ded3] bg-[#fbfcfa] p-8 text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#eef3ec] text-[#738b69]"><Icon name={icon} size={22} /></span>
        <h3 className="mt-4 text-sm font-semibold text-[#334035]">{title}</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-[var(--muted)]">{description}</p>
        {actionLabel && onAction && <button type="button" onClick={onAction} className="mt-4 text-xs font-semibold text-[#506545] underline decoration-[#b8c8b1] underline-offset-4 hover:text-[#bf6d4e]">{actionLabel}</button>}
      </div>
    </div>
  );
}

export function QuickNav() {
  const links = [
    ["Meeting", "/dashboard/meetings", "calendar"],
    ["Dokumen", "/dashboard/documents", "file"],
    ["Keuangan", "/dashboard/billing", "receipt"],
    ["Pengaturan", "/dashboard/settings", "settings"]
  ];
  return (
    <nav aria-label="Navigasi modul" className="hidden items-center gap-1 rounded-2xl border border-[var(--border)] bg-white/80 p-1.5 lg:flex">
      {links.map(([label, href, icon]) => <Link key={href} href={href} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[var(--muted)] transition hover:bg-[#eef3ec] hover:text-[#506545]"><Icon name={icon} size={15} />{label}</Link>)}
    </nav>
  );
}

export function ModuleFrame({ children, title = "Shaff Development" }: { children: ReactNode; title?: string }) {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="group flex items-center gap-3" aria-label="Kembali ke dashboard">
            <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#506545] text-sm font-bold tracking-[-0.08em] text-white shadow-[0_5px_12px_rgba(80,101,69,0.22)]">SD</span>
            <span className="hidden sm:block"><span className="block text-sm font-semibold tracking-[-0.02em] text-[#2d392f]">{title}</span><span className="mt-0.5 block text-[10px] uppercase tracking-[0.13em] text-[var(--muted)]">Ruang kerja internal</span></span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4"><QuickNav /><span className="grid h-9 w-9 place-items-center rounded-full bg-[#d7e3d2] text-xs font-bold text-[#506545]" title="Rizky Zaneva">RZ</span></div>
        </header>
        {children}
      </div>
    </main>
  );
}

export function TabButton({ active, children, onClick, count }: { active: boolean; children: ReactNode; onClick: () => void; count?: number }) {
  return <button type="button" onClick={onClick} className={`inline-flex min-h-10 items-center gap-2 border-b-2 px-1 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#738b69]/30 focus:ring-offset-2 ${active ? "border-[#506545] text-[#334935]" : "border-transparent text-[var(--muted)] hover:border-[#c7d3c3] hover:text-[#506545]"}`}>{children}{typeof count === "number" && <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-[#eef3ec] text-[#506545]" : "bg-[#f0f2f0] text-[#7a837b]"}`}>{count}</span>}</button>;
}

export function FormField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-[#526055]">{label}</span>{children}{hint && <span className="mt-1.5 block text-[11px] leading-4 text-[var(--muted)]">{hint}</span>}</label>;
}

export const inputClass = "h-11 w-full rounded-xl border border-[var(--border)] bg-[#fbfcfa] px-3 text-sm text-[#263328] outline-none transition placeholder:text-[#9aa39a] focus:border-[#738b69] focus:ring-2 focus:ring-[#738b69]/15";

export function SectionTitle({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) {
  return <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-sm font-semibold text-[#334035]">{title}</h2>{detail && <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>}</div>{action}</div>;
}

