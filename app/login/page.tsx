"use client"

import { FormEvent, useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("")
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Login gagal")
      const next = new URLSearchParams(window.location.search).get("next") || "/dashboard"
      window.location.assign(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard")
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Login gagal"); setBusy(false) }
  }
  return <main className="login-page"><div className="login-card"><div className="login-brand"><span className="brand-mark">S<span>.</span></span><span><strong>Shaff</strong><small>DEVELOPMENT</small></span></div><p className="eyebrow">Ruang kerja internal</p><h1>Selamat datang kembali.</h1><p className="login-copy">Masuk untuk melanjutkan pendampingan dan digitalisasi sistem bisnis client.</p><form onSubmit={submit} className="login-form"><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{error && <p className="login-error" role="alert">{error}</p>}<button className="button button-primary login-submit" disabled={busy}>{busy ? "Memeriksa..." : "Masuk ke workspace"}</button></form><p className="login-footnote">Akun dibuat oleh Admin Shaff Development.</p></div></main>
}
