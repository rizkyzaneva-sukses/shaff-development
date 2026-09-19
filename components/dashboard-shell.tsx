"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "./icons";

const navigation = [
  { label: "Ringkasan", href: "/dashboard", icon: "grid" as const, roles: ["ADMIN", "LEAD", "CMO", "COO", "FINANCE"] },
  { label: "Client", href: "/dashboard/clients", icon: "users" as const, roles: ["ADMIN", "LEAD", "CMO", "COO"] },
  { label: "Program", href: "/dashboard/programs", icon: "layers" as const, roles: ["ADMIN", "LEAD", "CMO", "COO"] },
  { label: "Pekerjaan", href: "/dashboard/tasks", icon: "checkSquare" as const, roles: ["ADMIN", "LEAD", "CMO", "COO"] },
];

const supportNavigation = [
  { label: "Panduan", href: "/dashboard/guide", icon: "book" as const, roles: ["ADMIN", "LEAD", "CMO", "COO", "FINANCE"] },
  { label: "Notifikasi", href: "/dashboard/notifications", icon: "bell" as const, roles: ["ADMIN", "LEAD", "CMO", "COO", "FINANCE"] },
  { label: "Template program", href: "/dashboard/templates", icon: "layers" as const, roles: ["ADMIN", "LEAD"] },
  { label: "Task berulang", href: "/dashboard/recurring", icon: "calendar" as const, roles: ["ADMIN", "LEAD"] },
  { label: "Catatan meeting", href: "/dashboard/meetings", icon: "note" as const, roles: ["ADMIN", "LEAD", "CMO", "COO"] },
  { label: "Dokumen", href: "/dashboard/documents", icon: "file" as const, roles: ["ADMIN", "LEAD", "CMO", "COO", "FINANCE"] },
  { label: "Invoice", href: "/dashboard/invoices", icon: "invoice" as const, roles: ["ADMIN", "LEAD", "FINANCE"] },
  { label: "Pengeluaran", href: "/dashboard/expenses", icon: "payment" as const, roles: ["ADMIN", "FINANCE", "LEAD", "CMO", "COO"] },
  { label: "Profil & Kata Sandi", href: "/dashboard/profile", icon: "users" as const, roles: ["ADMIN", "LEAD", "FINANCE", "CMO", "COO"] },
];

function getBreadcrumbTitle(path: string) {
  if (path === "/dashboard") return "Ringkasan";
  const segments = path.split("/").filter(Boolean);
  if (segments.length >= 3) {
    if (segments[1] === "tasks") return "Detail Pekerjaan";
    if (segments[1] === "clients") return "Detail Client";
    if (segments[1] === "programs") return "Detail Program";
    if (segments[1] === "invoices") return "Detail Invoice";
    if (segments[1] === "meetings") return "Detail Meeting";
  }
  const last = segments[segments.length - 1];
  const dict: Record<string, string> = {
    clients: "Client",
    programs: "Program",
    tasks: "Pekerjaan",
    guide: "Panduan",
    notifications: "Notifikasi",
    templates: "Template Program",
    recurring: "Task Berulang",
    meetings: "Catatan Meeting",
    documents: "Dokumen",
    invoices: "Invoice",
    billing: "Invoice & Pembayaran",
    expenses: "Pengeluaran",
    settings: "Pengaturan",
  };
  return dict[last] || last.replace(/-/g, " ");
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<{ name: string; jobTitle?: string | null; role: string } | null>(null);

  const closeMobile = () => setMobileOpen(false);

  const todayText = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.user) setCurrentUser(payload.user);
      })
      .catch(() => undefined);
  }, []);

  const displayName = currentUser?.name ?? "Shaff Development";
  const displayRole =
    currentUser?.jobTitle ??
    ({ ADMIN: "Administrator", LEAD: "Lead", MEMBER: "Pendamping", FINANCE: "Finance" }[currentUser?.role ?? ""] ??
      "Tim internal");
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SD";

  const userRole = currentUser?.role;
  const filteredNav = navigation.filter((item) => !userRole || item.roles.includes(userRole));
  const filteredSupport = supportNavigation.filter((item) => !userRole || item.roles.includes(userRole));

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/tasks?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <div className="app-frame">
      <aside className={`side-rail ${mobileOpen ? "is-open" : ""}`}>
        <div className="rail-brand">
          <div className="brand-mark">
            S<span>.</span>
          </div>
          <div>
            <div className="brand-name">Shaff</div>
            <div className="brand-caption">DEVELOPMENT</div>
          </div>
          <button className="rail-close mobile-only" onClick={closeMobile} aria-label="Tutup menu">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="rail-intro">
          <span className="eyebrow eyebrow-light">{todayText || "Hari ini"}</span>
          <p>
            Temani bisnis
            <br />
            <em>bertumbuh lebih rapi.</em>
          </p>
        </div>

        <nav className="rail-nav" aria-label="Navigasi utama">
          <span className="rail-heading">Workspace</span>
          {filteredNav.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={`rail-link ${active ? "active" : ""}`}
              >
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <span className="rail-heading rail-heading-gap">Resources</span>
          {filteredSupport.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={`rail-link ${active ? "active" : ""}`}
              >
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="rail-bottom">
          <div className="rail-tip">
            <div className="tip-star">
              <Icon name="spark" size={15} />
            </div>
            <div>
              <strong>Ritme Kolaborasi</strong>
              <span>Target terstruktur & rapi</span>
            </div>
          </div>
          <Link href="/dashboard/settings" className="rail-link">
            <Icon name="target" size={17} />
            <span>Pengaturan</span>
          </Link>
          <Link href="/dashboard/profile" className="profile-mini">
            <div className="avatar avatar-coral">{initials}</div>
            <div>
              <strong>{displayName}</strong>
              <span>{displayRole} · Lihat profil</span>
            </div>
          </Link>
          <button
            type="button"
            className="rail-link profile-logout"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.replace("/login");
            }}
          >
            <Icon name="logOut" size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {mobileOpen && <button className="mobile-scrim" aria-label="Tutup menu" onClick={closeMobile} />}
      <main className="main-area">
        <header className="top-bar">
          <button className="mobile-menu mobile-only" onClick={() => setMobileOpen(true)} aria-label="Buka menu">
            <Icon name="menu" size={21} />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <Icon name="chevron" size={14} />
            <strong>{getBreadcrumbTitle(pathname)}</strong>
          </div>
          <div className="top-actions">
            <form onSubmit={handleSearch} className="top-search">
              <Icon name="search" size={17} />
              <input
                placeholder="Cari client, task..."
                aria-label="Cari"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <Link href="/dashboard/notifications" className="icon-button has-dot" aria-label="Notifikasi">
              <Icon name="bell" size={19} />
            </Link>
            <div className="top-avatar avatar avatar-coral">{initials}</div>
          </div>
        </header>
        <div className="page-wrap">{children}</div>
      </main>
    </div>
  );
}
