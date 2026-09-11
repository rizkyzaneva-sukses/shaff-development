"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { Icon } from "./icons"

const navigation = [
  { label: "Ringkasan", href: "/dashboard", icon: "grid" },
  { label: "Client", href: "/dashboard/clients", icon: "users" },
  { label: "Program", href: "/dashboard/programs", icon: "layers" },
  { label: "Pekerjaan", href: "/dashboard/tasks", icon: "checkSquare" },
]

const supportNavigation = [
  { label: "Panduan", href: "/dashboard/guide", icon: "book" },
  { label: "Notifikasi", href: "/dashboard/notifications", icon: "bell" },
  { label: "Template program", href: "/dashboard/templates", icon: "layers" },
  { label: "Task berulang", href: "/dashboard/recurring", icon: "calendar" },
  { label: "Catatan meeting", href: "/dashboard/meetings", icon: "note" },
  { label: "Dokumen", href: "/dashboard/documents", icon: "file" },
  { label: "Invoice", href: "/dashboard/invoices", icon: "invoice" },
  { label: "Pengeluaran", href: "/dashboard/expenses", icon: "payment" },
]

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ name: string; jobTitle?: string | null; role: string } | null>(null)
  const closeMobile = () => setMobileOpen(false)

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((payload) => {
      if (payload?.user) setCurrentUser(payload.user)
    }).catch(() => undefined)
  }, [])

  const displayName = currentUser?.name ?? "Shaff Development"
  const displayRole = currentUser?.jobTitle ?? ({ ADMIN: "Administrator", LEAD: "Lead", MEMBER: "Pendamping", FINANCE: "Finance" }[currentUser?.role ?? ""] ?? "Tim internal")
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SD"

  return (
    <div className="app-frame">
      <aside className={`side-rail ${mobileOpen ? "is-open" : ""}`}>
        <div className="rail-brand">
          <div className="brand-mark">S<span>.</span></div>
          <div>
            <div className="brand-name">Shaff</div>
            <div className="brand-caption">DEVELOPMENT</div>
          </div>
          <button className="rail-close mobile-only" onClick={closeMobile} aria-label="Tutup menu"><Icon name="close" size={18} /></button>
        </div>

        <div className="rail-intro">
          <span className="eyebrow eyebrow-light">Rabu, 11 September 2026</span>
          <p>Temani bisnis<br /><em>bertumbuh lebih rapi.</em></p>
        </div>

        <nav className="rail-nav" aria-label="Navigasi utama">
          <span className="rail-heading">Workspace</span>
          {navigation.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return <Link key={item.href} href={item.href} onClick={closeMobile} className={`rail-link ${active ? "active" : ""}`}><Icon name={item.icon} size={17} /><span>{item.label}</span>{item.label === "Pekerjaan" && <span className="rail-count">12</span>}</Link>
          })}
          <span className="rail-heading rail-heading-gap">Resources</span>
          {supportNavigation.map((item) => {
            const active = pathname.startsWith(item.href)
            return <Link key={item.href} href={item.href} onClick={closeMobile} className={`rail-link ${active ? "active" : ""}`}><Icon name={item.icon} size={17} /><span>{item.label}</span></Link>
          })}
        </nav>

        <div className="rail-bottom">
          <div className="rail-tip"><div className="tip-star"><Icon name="spark" size={15} /></div><div><strong>Ritme minggu ini</strong><span>3 dari 4 review selesai</span></div></div>
          <Link href="/dashboard/settings" className="rail-link"><Icon name="target" size={17} /><span>Pengaturan</span></Link>
          <button type="button" className="profile-mini profile-button" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login") }}><div className="avatar avatar-coral">{initials}</div><div><strong>{displayName}</strong><span>{displayRole} · Keluar</span></div><Icon name="logOut" size={16} /></button>
        </div>
      </aside>

      {mobileOpen && <button className="mobile-scrim" aria-label="Tutup menu" onClick={closeMobile} />}
      <main className="main-area">
        <header className="top-bar">
          <button className="mobile-menu mobile-only" onClick={() => setMobileOpen(true)} aria-label="Buka menu"><Icon name="menu" size={21} /></button>
          <div className="breadcrumbs"><span>Workspace</span><Icon name="chevron" size={14} /><strong>{pathname === "/dashboard" ? "Ringkasan" : pathname.split("/").pop()?.replace(/-/g, " ")}</strong></div>
          <div className="top-actions"><div className="top-search"><Icon name="search" size={17} /><input placeholder="Cari client, task..." aria-label="Cari" /></div><Link href="/dashboard/notifications" className="icon-button has-dot" aria-label="Notifikasi"><Icon name="bell" size={19} /></Link><div className="top-avatar avatar avatar-coral">{initials}</div></div>
        </header>
        <div className="page-wrap">{children}</div>
      </main>
    </div>
  )
}
