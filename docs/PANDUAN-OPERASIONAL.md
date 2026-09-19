# 📘 Panduan Operasional — Shaff Development

**Aplikasi:** shaff-app (internal ops app)
**Repo:** `rizkyzaneva-sukses/shaff-development`
**Live:** https://shaff.gampangin.biz.id
**Server:** 43.128.112.82 (Tencent Lighthouse) · EasyPanel + Traefik
**Terakhir diperbarui:** 19 September 2026

---

## 🗺️ Peta Cepat: Di Mana Apa Berada

```
┌──────────────────────────────────────────────────────────────┐
│                    INTERNET (Browser kamu)                    │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼──────────────────────────────────┐
│  TRAEFIK  (EasyPanel)  —  gerbang masuk, urus HTTPS          │
│  • Terima request → teruskan ke container shaff-app          │
│  • Urus sertifikat (Let's Encrypt)                           │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTP internal
┌───────────────────────────▼──────────────────────────────────┐
│  shaff_app                                                  │
│  • Next.js 16 (halaman + API)                                │
│  • Prisma (bicara ke database)                               │
└───────────────────────────┬──────────────────────────────────┘
                            │ port 5432 internal
┌───────────────────────────▼──────────────────────────────────┐
│  shaff_db  (PostgreSQL)  —  seluruh data bisnis di sini      │
└──────────────────────────────────────────────────────────────┘
```

**Istilah singkat:**
| Istilah | Artinya |
|---|---|
| **EasyPanel** | Dashboard kontrol. Kamu pakai ini untuk deploy, lihat log, atur env |
| **Traefik** | "Satpam + resepsionis" — terima trafik, urus HTTPS, antar ke app |
| **Container** | Kotak terisolasi tempat app berjalan |
| **Deploy** | Proses memasukkan kode baru ke server |
| **Env var** | Setelan rahasia (password, API key) yang disuntik ke app |

---

## 🔐 Akun Login (terverifikasi 19 Sep 2026)

Aplikasi memiliki **tepat 4 role** — tidak ada role CEO/COO/CMO/CTO/CFO.

| Email | Role | Bisa mengakses |
|---|---|---|
| `admin@shaff.dev` | ADMIN | Semua modul, kelola akun tim |
| `lead@shaff.dev` | LEAD | Client & program yang dipimpin |
| `member@shaff.dev` | MEMBER | Task yang di-assign saja |
| `finance@shaff.dev` | FINANCE | Invoice, pembayaran, pengeluaran |

> ⚠️ **Password demo diambil dari `SEED_DEMO_PASSWORD` di `.env` server — JANGAN menebak.**
> Nilainya mengandung tanda kutip yang ikut terbaca sebagai bagian password. Selalu cek langsung:
> ```bash
> node -e "const m=require('fs').readFileSync('.env','utf8').match(/SEED_DEMO_PASSWORD=(.*)/);console.log(JSON.stringify(m[1].trim()))"
> ```
> Jalankan `resetDemoData` untuk menyegarkan semua akun ke password tersebut.

---

## 🔄 WORKFLOW 1: Deploy Perubahan Kode

Ini yang paling sering kamu lakukan.

```
   LOKAL (komputer kamu)              SERVER (43.128.112.82)
   ─────────────────────              ──────────────────────
   1. Edit kode
        │
        ▼
   2. npm run build          ← WAJIB, jangan skip
        │  (cek dulu tidak error)
        ▼
   3. git add + commit
        │
        ▼
   4. git push ──────────────►  5. EasyPanel tangkap perubahan
                                     │
                                     ▼
                                 6. Build ulang container
                                     │
                                     ▼
                                 7. Container baru jalan
                                     │
                                     ▼
                                 8. Cek: buka shaff.gampangin.biz.id
```

**Aturan penting:**
- ⚠️ **Selalu `npm run build` di lokal sebelum push.** Kalau build lokal gagal, deploy di server pasti gagal juga — tapi kamu buang waktu 5 menit menunggu.
- ⚠️ **Perubahan commit hanya akan live setelah redeploy.** Push ≠ live.
- ⚠️ **Setelah deploy, error `Server Reference ID` akan muncul di log** selama beberapa saat bagi user yang masih pegang halaman lama. Ini normal dan akan hilang sendiri (sudah diperbaiki agar tidak permanen).

---

## 🚨 WORKFLOW 2: User Lapor Error ("Halaman error / blank")

```
   User lapor error
        │
        ▼
   ┌─────────────────────────────┐
   │ 1. Tanya: halaman apa?      │
   │    Error apa yang muncul?   │
   └────────────┬────────────────┘
                │
                ▼
   ┌─────────────────────────────┐
   │ 2. Coba sendiri di browser  │
   │    (pakai mode Incognito)   │
   └────────────┬────────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
   Ketular juga?    Hanya user itu?
        │               │
        ▼               ▼
   Masalah APP      Minta user:
        │           • Hard refresh
        ▼           • Ctrl+Shift+R
   ┌──────────────┐  (buang cache lama)
   │ 3. Cek log   │
   └──────┬───────┘
          │
          ▼
   Ada error di log?
     • "Server Reference ID" → cache lama, suruh user hard refresh
     • "Can't reach database" → database mati, lihat WORKFLOW 4
     • Error lain → catat, telusuri
```

**Cara cek log (lewat SSH):**
```bash
ssh ubuntu@43.128.112.82
sudo docker logs --tail 100 <nama-container-shaff-app> 2>&1
```

> 💡 **Tips:** kalau error hanya di 1 user, 90% itu cache browser. Suruh hard refresh dulu sebelum panik.

---

## 💾 WORKFLOW 3: Deploy Ulang saat App Bermasalah (Rollback)

Kalau deploy baru merusak sesuatu:

```
   App rusak setelah deploy
        │
        ▼
   ┌──────────────────────────────┐
   │ OPSI A (paling cepat):       │
   │ EasyPanel → shaff-app →      │
   │ tab Deployments → pilih      │
   │ versi sebelumnya → Redeploy  │
   └──────────────┬───────────────┘
                  │
                  ▼
   ┌──────────────────────────────┐
   │ OPSI B (via git):            │
   │ git revert <commit-rusak>    │
   │ git push                     │
   └──────────────────────────────┘
```

⚠️ **Jangan pernah** restart container database (`shaff-db`) untuk mengatasi masalah app — itu tidak akan menolong dan berisiko.

---

## 🔑 WORKFLOW 4: Mengatur Env Var (Rahasia/Setelan)

Beberapa fitur butuh "kunci rahasia" yang diset di server, bukan di kode.

**Cara pasang:**
```
EasyPanel → project "shaff" → service "shaff-app"
   → tab "Environment"
   → tambahkan: NAMA=value
   → Save → Redeploy
```

**Env yang dibutuhkan app:**
| Env | Fungsi | Status |
|---|---|---|
| `DATABASE_URL` | Alamat database | ✅ sudah ada |
| `WAHA_URL` | Alamat server WhatsApp | ❌ **belum — fitur WA mati** |
| `WAHA_API_KEY` | Kunci API WhatsApp | ❌ **belum** |
| `WAHA_SESSION` | Nama sesi WhatsApp | ❌ belum |
| `CRON_SECRET` | Kunci untuk scheduler otomatis | ❌ belum — scheduler 401 |
| `APP_ORIGIN` | Domain resmi app | ❌ belum (fallback masih jalan) |
| `FILE_STORAGE_PATH` | Lokasi simpan file upload | ✅ sudah ada |
| `TRUST_PROXY` | Tidak perlu diisi | — |

> ⚠️ **Jangan pakai `NEXTAUTH_SECRET`** — itu sisa konfigurasi lama, app ini tidak pakai NextAuth.

---

## 🛠️ WORKFLOW 5: Menguji Apakah App Sehat

Tiga perintah ini cukup untuk tahu app baik-baik saja:

```bash
# 1. App hidup?
curl -s -o /dev/null -w "%{http_code}\n" https://shaff.gampangin.biz.id/login
# Harus: 200

# 2. Database hidup?
curl -s https://shaff.gampangin.biz.id/api/health
# Harus: {"status":"ok","database":"ok"}

# 3. HTTPS aktif?
curl -sI https://shaff.gampangin.biz.id/login | grep -i strict-transport
# Harus muncul (HSTS aktif)
```

Kalau no.2 gagal (`"database":"unavailable"`) → masalah database, bukan app.

---

## 📋 Checklist: Sebelum Mengubah Apa Pun di Produksi

Sebelum sentuh server, pastikan:
- [ ] Data penting sudah saya pikirkan risikonya
- [ ] Kalau salah, apa yang rusak? (app lain? panel?)
- [ ] Saya punya cara membatalkan (rollback)?
- [ ] Saya sudah uji di lokal dulu?

> 🛑 **Prinsip:** jangan pernah jalankan perintah yang bisa memutus akses SSH atau panel. Kalau tidak yakin — tanya dulu.

---

## 🎯 Prioritas Perbaikan yang Masih Terbuka

| # | Masalah | Prioritas | Catatan |
|---|---|---|---|
| 1 | Fitur WhatsApp mati (env WAHA kosong) | 🔴 Tinggi | Kamu set sendiri di env |
| 2 | `CRON_SECRET` belum diisi | 🟠 Sedang | Scheduler tidak bisa jalan |
| 3 | Panel EasyPanel terbuka di `IP:3000` | 🟠 Sedang | **Jangan pakai ufw global** — bisa putus app lain |
| 4 | Metadata Docker rusak (`Dead` container) | 🟡 Rendah | Data dummy, tidak mendesak |
| 5 | Backup database | ⚪ Nanti | Aman selama masih data dummy |
| 6 | Sisa 9 user lama di DB produksi | 🟠 Sedang | Perlu jalankan `resetDemoData` setelah redeploy |

### ✅ Sudah diperbaiki & terverifikasi (19 Sep 2026)
| Perbaikan | Bukti |
|---|---|
| Tabel `Expense` dibuat di DB | 22 → 23 tabel, `POST /api/expenses` → 201 |
| Login 4 role berfungsi | semua role → HTTP 200 |
| Data demo jadi 4 user (dari 9) | query DB: `TOTAL USER: 4` |
| Role lama dihapus dari panduan app | `CEO/COO/CMO/CTO/CFO` hilang dari bundle |
| Cache 1 tahun dihapus | `Cache-Control: private, no-store` aktif |
| Alur workflow (client → program → task → expense) | semua `POST` → 201 |


---

## ⚡ Aturan Emas (Hafalkan Ini)

1. **Build lokal sebelum push** — hemat 5 menit menunggu
2. **Push ≠ live** — wajib redeploy
3. **Error di 1 user = cache browser** — suruh hard refresh
4. **Jangan restart database** untuk memperbaiki masalah app
5. **Jangan pakai ufw global** — bisa mengunci panel & app lain
6. **Ragu = tanya** — lebih baik lambat 5 menit daripada server down
