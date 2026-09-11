# Shaff Development

Ruang kerja internal Shaff Development untuk mengelola pendampingan dan digitalisasi sistem bisnis client UMKM. MVP ini mengikuti alur `Tim → Client → Program → Task/Activity → Progress → Invoice/Payment`.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, dan Prisma. Fallback data demo hanya tersedia untuk development ketika `DATABASE_URL` belum tersedia; mode production akan gagal dengan jelas dan tidak pernah menampilkan data mock.

## Menjalankan lokal

Prasyarat: Node.js 20 LTS atau lebih baru dan PostgreSQL 14+ bila ingin menjalankan data persisten.

```bash
npm install
Copy-Item .env.example .env.local
# Sesuaikan DATABASE_URL di .env.local
$env:SEED_DEMO_PASSWORD = "gunakan-password-development-minimal-12-karakter"
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`. Seed demo tidak memiliki password default; isi `SEED_DEMO_PASSWORD` (minimal 12 karakter) hanya saat menjalankan seed di lingkungan development.

### Akun quick start tim

Semua akun berikut dibuat oleh `prisma/seed.ts` dan memakai nilai `SEED_DEMO_PASSWORD` yang Anda isi sendiri saat seed. Password tidak disimpan di repository.

| Peran | Email | Permission MVP |
| --- | --- | --- |
| CEO | `ceo@shaff.dev` | `ADMIN` untuk ringkasan dan keputusan lintas workspace |
| COO | `coo@shaff.dev` | `ADMIN` untuk koordinasi dan assignment operasional |
| CMO | `cmo@shaff.dev` | `LEAD`, perlu ditetapkan sebagai lead client/program |
| CTO | `cto@shaff.dev` | `MEMBER`, akses sesuai keanggotaan program |
| CFO | `cfo@shaff.dev` | `FINANCE` untuk invoice dan payment |

Setelah login, buka menu **Panduan**. Halaman tersebut berisi quick start 15 menit, workflow `Client → Program → Task → Meeting → Dokumen → Invoice → Payment`, ritme tiap role, permission map, dan aturan kerja wajib. Jalankan [UAT plan](docs/UAT-PLAN-Shaff-Development.md) di staging untuk CEO, COO, CMO, CTO, dan CFO.

## Perintah utama

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Server development |
| `npm run build` | Generate Prisma Client dan production build |
| `npm run typecheck` | Pemeriksaan TypeScript |
| `npm run db:push` | Sinkronisasi schema ke database lokal |
| `npm run db:migrate` | Membuat migration Prisma |
| `npm run db:seed` | Seed data demo yang dapat dijalankan berulang |
| `npm run db:studio` | Prisma Studio |

## Modul yang sudah tersedia

Dashboard operasional, client dan kontak, program, task dan progress, meeting, dokumen private, invoice/payment, pengaturan organisasi dan tim, audit log, notifikasi overdue/upcoming, health program, template program, task berulang, export CSV, serta import client CSV.

Untuk workflow pengguna CEO, COO, CMO, CTO, dan CFO, buka menu **Panduan** setelah login. Role server tetap membatasi data walaupun URL atau request dipanggil langsung.

## Deploy ke EasyPanel dengan Docker

Repository ini sudah menyertakan `Dockerfile` production berbasis Node 20 Alpine. EasyPanel dapat memakai repository ini langsung dengan pengaturan berikut:

- **Build method:** Dockerfile
- **Port container:** `3000`
- **Start command:** gunakan default image (`node server.js`)
- **Health check path:** `/api/health`
- **Environment:** `NODE_ENV=production`, `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_NAME`, `FILE_STORAGE_PATH`, dan migration flag

`DATABASE_URL` memakai format PostgreSQL, misalnya:

```text
postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
```

Untuk database production baru, gunakan `PRISMA_MIGRATE_DEPLOY=true` pada deploy pertama agar migration di `prisma/migrations` dijalankan. Setelah migration selesai, ubah kembali menjadi `PRISMA_MIGRATE_DEPLOY=false`. `PRISMA_DB_PUSH=true` disediakan hanya untuk bootstrap database kosong/legacy yang belum memakai migration; jangan mengaktifkannya sebagai kebiasaan setiap deploy.

Container tidak membawa `.env` dari repository. Isi secret langsung di EasyPanel dan jangan commit password database, `NEXTAUTH_SECRET`, atau data client. Pasang private volume pada `FILE_STORAGE_PATH` (misalnya `/app/data/private`) agar dokumen tetap ada saat container diganti.

### Backup dan restore

Gunakan [runbook backup/restore](docs/RUNBOOK-Backup-Restore.md). Script `scripts/backup.sh` membuat dump PostgreSQL dan arsip storage private; `scripts/restore.sh` hanya berjalan jika `CONFIRM_RESTORE=YES` dan diarahkan ke database/volume pemulihan terpisah. Restore rehearsal tetap membutuhkan kredensial PostgreSQL dan volume EasyPanel nyata.

### Build dan smoke test lokal

```bash
docker build -t shaff-development:local .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/shaff_development?schema=public" \
  -e NEXTAUTH_SECRET="replace-with-a-long-random-string" \
  -e NEXT_PUBLIC_APP_NAME="Shaff Development" \
  shaff-development:local
```

Buka `http://localhost:3000/dashboard` setelah container siap.

## Struktur fondasi

- `app/` — layout, metadata, dan global styles App Router.
- `lib/prisma.ts` — singleton Prisma Client untuk server.
- `lib/data.ts` — query dashboard dengan fallback data demo.
- `lib/mock-data.ts` — dataset UI yang aman dan fiktif.
- `lib/types.ts` / `lib/utils.ts` — kontrak domain dan format rupiah/tanggal/progress.
- `prisma/schema.prisma` — model domain, enum, relasi, dan indeks awal.
- `prisma/seed.ts` — akun role Admin, Lead, Member, Finance serta akun quick start CEO, CMO, CTO, CFO, COO beserta contoh client, program, task, invoice, dan payment.

## Catatan implementasi

Server action dan route handler wajib memeriksa role serta scope object di server. File client harus memakai storage privat; schema ini menyimpan metadata dan storage key, bukan isi file. Invoice menyimpan snapshot identitas saat diterbitkan, pembayaran tidak dihapus permanen, dan AuditLog bersifat append-only bagi pengguna aplikasi. Detail autentikasi, storage privat, backup, serta rate limit dilanjutkan sesuai gate pada PRD.
