"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  // Reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState("demo123");
  const [resetting, setResetting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login gagal");
      const next = new URLSearchParams(window.location.search).get("next") || "/dashboard";
      window.location.assign(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login gagal");
      setBusy(false);
    }
  }

  function fillAccount(accountEmail: string, accountPass = "demo123") {
    setEmail(accountEmail);
    setPassword(accountPass);
    setError("");
  }

  async function handleResetDemo() {
    setResetting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/demo/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: resetPasswordInput.trim() || "demo123" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset data dummy gagal");

      const passUsed = resetPasswordInput.trim() || "demo123";
      setEmail("admin@shaff.dev");
      setPassword(passUsed);
      setShowResetModal(false);
      setSuccess(`Data dummy berhasil di-reset! Akun Admin (admin@shaff.dev / ${passUsed}) siap digunakan.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Reset data demo gagal");
    } finally {
      setResetting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark">
            S<span>.</span>
          </span>
          <span>
            <strong>Shaff</strong>
            <small>DEVELOPMENT</small>
          </span>
        </div>
        <p className="eyebrow">Ruang kerja internal</p>
        <h1>Selamat datang kembali.</h1>
        <p className="login-copy">Masuk untuk melanjutkan pendampingan dan digitalisasi sistem bisnis client.</p>

        {success && (
          <div className="rounded-xl bg-[#eef3ec] p-3 text-xs font-semibold text-[#506545] border border-[#b8c8b1]" role="alert">
            {success}
          </div>
        )}

        <form onSubmit={submit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              placeholder="nama@shaff.dev"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          <button className="button button-primary login-submit" disabled={busy}>
            {busy ? "Memeriksa..." : "Masuk ke workspace"}
          </button>
        </form>

        {/* Demo Quick Fill & Reset Section */}
        <div className="mt-5 border-t border-[var(--border)] pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">Akun Cepat Demo</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => fillAccount("admin@shaff.dev")}
              className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-medium text-[#4b584d] hover:border-[#506545] hover:text-[#506545]"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillAccount("lead@shaff.dev")}
              className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-medium text-[#4b584d] hover:border-[#506545] hover:text-[#506545]"
            >
              Lead
            </button>
            <button
              type="button"
              onClick={() => fillAccount("member@shaff.dev")}
              className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-medium text-[#4b584d] hover:border-[#506545] hover:text-[#506545]"
            >
              Member
            </button>
            <button
              type="button"
              onClick={() => fillAccount("finance@shaff.dev")}
              className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-medium text-[#4b584d] hover:border-[#506545] hover:text-[#506545]"
            >
              Finance
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="text-xs font-semibold text-[#bf6d4e] hover:underline"
            >
              🔄 Reset Data Dummy / Demo
            </button>
            <span className="text-[11px] text-[var(--muted)]">Pass default: demo123</span>
          </div>
        </div>
      </div>

      {/* Modal Dialog for Reset Demo */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#283529]/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xl sm:p-7">
            <p className="eyebrow">Database Reset</p>
            <h2 className="mt-1 text-xl font-semibold text-[#334035]">Reset Data Dummy / Demo</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Tindakan ini akan membuat ulang data demo (organisasi, akun tim, client Kopi Ruang Tengah, task dengan checklist, meeting, dan invoice) ke kondisi segar.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-[#4b584d]">
                Password baru untuk semua akun demo:
                <input
                  type="text"
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--border)] p-2.5 text-sm"
                  placeholder="demo123"
                  required
                />
              </label>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                Semua akun (admin, lead, member, finance) akan menggunakan password ini.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
                className="button button-quiet"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetDemo}
                disabled={resetting}
                className="button button-primary bg-[#bf6d4e] hover:bg-[#a95f42]"
              >
                {resetting ? "Mereset data..." : "Reset Data Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
