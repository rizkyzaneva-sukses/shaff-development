# Security audit — Shaff Development

**Tanggal audit:** 11 September 2026  
**Ruang lingkup:** repository aplikasi, dependency production, route protection, session, validasi mutasi, file private, invoice/payment, Docker runtime, dan kesesuaian dengan PRD.

## Kesimpulan

Lapisan server utama sudah ditambahkan dan audit dependency production saat ini menghasilkan **0 vulnerabilities**. Dashboard dan halaman operasional mengambil data dari API/database; fallback demo hanya berjalan saat development tanpa `DATABASE_URL` dan tidak digunakan ketika `NODE_ENV=production`. Cookie session bersifat httpOnly/SameSite, route API memeriksa role dan scope object, dan mutasi invoice/payment memakai transaksi serta idempotency key.

Aplikasi sudah siap untuk validasi staging. Beberapa kontrol masih membutuhkan bukti operasional dari environment EasyPanel: migration production, private volume, backup/restore rehearsal, rate limit terdistribusi jika memakai lebih dari satu replica, dan UAT formal dengan kelima role bisnis.

## Temuan yang sudah ditutup

| Risiko | Perbaikan | Bukti |
|---|---|---|
| Dashboard dan API dapat diakses tanpa login | `proxy.ts` mengarahkan `/dashboard` ke `/login` dan menolak API privat tanpa cookie session | Smoke test: `/dashboard` → `307 /login?next=%2Fdashboard`, API privat → `401` |
| Tidak ada session yang dapat dicabut | `Session` menyimpan hash token, expiry, revokedAt, dan lastSeenAt; logout, reset, dan ganti password mencabut session | `lib/auth.ts`, `prisma/schema.prisma` |
| Password seed hardcoded di source | `SEED_DEMO_PASSWORD` wajib diisi; tidak ada default password | `prisma/seed.ts`, `.env.example` |
| Login brute force | Batas 8 percobaan per kombinasi IP/email per 15 menit pada instance | `lib/auth.ts` |
| CSRF untuk mutasi browser | `SameSite=Lax` dan validasi `Origin` pada route mutasi | `assertSameOrigin` dan route POST/PATCH |
| IDOR lintas client/program/file | Query server mengikat role ke Lead, ProgramMember, Finance, atau Admin; download file melakukan pemeriksaan ulang | `app/api/clients`, `programs`, `tasks`, `documents` |
| Token aktivasi/reset tersimpan mentah | Hanya SHA-256 token yang disimpan; token sekali pakai memiliki expiry | `AuthToken`, `/api/auth/activate`, `/api/auth/reset` |
| Pembayaran ganda/overpayment | Transaksi saldo, validasi tanggal/nominal, `Idempotency-Key`, dan void beralasan | `/api/invoices/[id]/payments`, `/api/payments/[id]/void` |
| Nomor invoice bentrok | `InvoiceSequence` dan transaksi penerbitan dengan idempotency key | `/api/invoices/[id]/issue` |
| File client dapat ditebak atau dipublikasikan | Storage key UUID, folder private, download lewat route yang terotorisasi, nama file hanya sebagai display name | `lib/storage.ts`, `/api/documents/[id]/download` |
| Upload berbahaya | Batas 20 MB, allowlist MIME, signature PDF/PNG/JPEG/OOXML, penolakan macro marker, nama file dinormalisasi | `lib/storage.ts` |
| Security headers tidak tersedia | CSP, HSTS ditangani oleh reverse proxy EasyPanel, X-Content-Type-Options, frame deny, Referrer-Policy, Permissions-Policy, COOP | `next.config.mjs` |
| Dependency kritis | Next di-upgrade ke 16.3.4, React 19.3.0, PostCSS terbaru yang ter-resolve; audit production bersih | `package.json`, `package-lock.json`, `npm audit --omit=dev` |

## Pemetaan PRD saat ini

| Area PRD | Status implementasi |
|---|---|
| FR-01 auth, aktivasi, reset, role | **Terhubung**: login/logout/me, invite Admin, activation/reset token, password change, dan pengelolaan tim Settings. |
| FR-02 client dan kontak | **Terhubung**: daftar/detail/create, filter, import CSV, activity, serta scope server. |
| FR-03 program | **Terhubung**: daftar/detail/create, anggota, status, health/risk, dan scope server. |
| FR-04 task dan optimistic version | **Terhubung**: board/detail/create/update, validasi blocked/done, dan konflik versi. |
| FR-05 progress | **Terhubung**: progress task dari database dan health program. |
| FR-06 meeting | **Terhubung**: draft, finalisasi, summary/decision, dan activity. |
| FR-07 dokumen | **Terhubung**: upload/download private, archive/restore, review approval, dan scope. |
| FR-08 invoice | **Terhubung**: draft, approval, issue, sequence, snapshot, cancel, dan export. |
| FR-09 payment | **Terhubung**: partial, saldo, idempotency, void, dan tampilan billing. |
| FR-10 dashboard | **Terhubung**: dashboard API-scoped, notifikasi overdue/upcoming, health, dan export CSV. |
| FR-11 audit | **Terhubung**: audit log append-only di API dan halaman filter/pagination Admin. |
| NFR-01 keamanan | Fondasi server dan headers tersedia; HTTPS, secrets, storage volume, dan rate limit terdistribusi harus diverifikasi di EasyPanel. |
| NFR-02 performa | Belum ada load test dataset PRD. |
| NFR-03 backup/restore | Belum dijalankan; membutuhkan konfigurasi PostgreSQL/storage EasyPanel dan rehearsal restore. |
| NFR-04 kualitas | Lint, typecheck, build lulus; UAT browser/mobile belum dieksekusi sebagai sesi formal. |

## Residual risk sebelum production

1. **Database production wajib tersedia.** Tanpa `DATABASE_URL` atau ketika koneksi gagal, production mengembalikan error/health degraded dan tidak menampilkan data mock.
2. **Storage masih filesystem lokal.** Pasang volume privat EasyPanel pada `FILE_STORAGE_PATH` atau pindahkan `lib/storage.ts` ke object storage S3-compatible dengan bucket private, signed download, dan lifecycle policy.
3. **Rate limit masih in-memory.** Dengan lebih dari satu replica, gunakan Redis/Upstash atau rate limiter di reverse proxy. In-memory cukup untuk satu instance pilot, bukan skala horizontal.
4. **Backup dan restore belum terbukti.** Jadwalkan backup database dan volume file, uji restore ke environment terpisah, catat RPO/RTO aktual, dan jangan menganggap snapshot hosting sebagai bukti restore.
5. **Seed hanya untuk development.** Jangan menjalankan `prisma db seed` pada production. Gunakan `PRISMA_MIGRATE_DEPLOY=true` untuk migration pertama dan kembalikan ke `false` setelah sukses.
6. **CSP masih memakai `unsafe-inline` untuk kompatibilitas Next/Tailwind.** Jika threat model membutuhkan CSP ketat, migrasikan ke nonce-based CSP dan uji seluruh RSC/asset sebelum menghapus allowance ini.

## Perintah verifikasi yang dijalankan

```text
npx prisma validate                         PASS (dengan DATABASE_URL dummy)
npm run lint                                PASS
npm run typecheck                           PASS
npm run build                               PASS
npm audit --omit=dev --audit-level=moderate PASS — 0 vulnerabilities
GET /api/health                             200 tanpa session
GET /api/auth/me                            401 tanpa session
GET /dashboard                              307 ke /login tanpa session
```

## Gate sebelum pilot

- UI utama sudah terhubung ke API/database dan fallback mock production sudah ditutup.
- Jalankan UAT-01 sampai UAT-13 dengan CEO, COO, CMO, CTO, dan CFO pada staging.
- Konfigurasikan private volume, migration, HTTPS, secret manager, backup, dan restore rehearsal di EasyPanel.
- Jalankan security test IDOR/upload/session dan load test dataset NFR-02.
- Minta sign-off pemilik produk dan Finance setelah bukti UAT tersimpan di checklist.
