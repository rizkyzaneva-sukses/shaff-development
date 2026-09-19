# 🎯 3 Studi Kasus Latihan — Shaff Development

**Untuk:** Tim internal Shaff Development
**Tujuan:** Melatih alur kerja end-to-end di aplikasi, dengan tingkat kesulitan bertingkat

**Aplikasi:** https://shaff.gampangin.biz.id

---

## 🔐 Akun Latihan

| Email | Jabatan | Hak akses | Password |
|---|---|---|---|
| `admin@shaff.dev` | Administrator | ADMIN | `ShaffDev2024!` |
| `lead@shaff.dev` | Chief Executive Officer | LEAD | `ShaffDev2024!` |
| `cmo@shaff.dev` | Chief Marketing Officer | CMO | `ShaffDev2024!` |
| `member@shaff.dev` | Chief Operating Officer | COO | `ShaffDev2024!` |
| `finance@shaff.dev` | Chief Financial Officer | FINANCE | `ShaffDev2024!` |

> ⚠️ **Semua akun pakai password yang sama.** Login satu akun per orang — jangan berebut akun yang sama, karena mengubah data bisa saling menimpa.

---

## 📋 Aturan Izin (WAJIB dipahami dulu)

Sebelum mulai, pahami siapa boleh apa. **Coba juga yang TIDAK boleh** — itu bagian dari latihan.

| Aksi | Yang boleh |
|---|---|
| Input prospek (client baru) | ADMIN, **CMO** |
| Ubah prospek → client aktif | ADMIN, CEO, **COO** |
| Buat program pendampingan | ADMIN, **CMO**, **CFO** |
| Kerjakan task, catat meeting, unggah dokumen | ADMIN, CEO, CMO, COO |
| Invoice & pembayaran | ADMIN, **CFO** |
| Lihat pengeluaran | **semua** (tapi hanya ADMIN & CFO yang bisa mengubah) |
| Action log | ADMIN, **CEO** |

---

# 📗 KASUS-1 — Prospek Baru (Tingkat: Mudah)

## Situasi
**Kedai Kopi Merdeka** datang dari pameran UMKM. Mereka tertarik, tapi belum deal.
Data client sudah ada, statusnya masih **Prospek**, dan **belum punya program**.

## Yang harus dilakukan (berurutan)

| # | Langkah | Login sebagai | Yang diharapkan |
|---|---|---|---|
| 1 | Buka menu **Client**, cari "KASUS-1 Kedai Kopi Merdeka" | ADMIN | Ketemu, status **Prospek** |
| 2 | Klik namanya → lihat detail. Coba buat **Program baru** | ADMIN | ❌ **GAGAL** — muncul pesan "Client masih berstatus PROSPECT..." |
| 3 | Sama seperti #2, tapi login sebagai **CFO** | CFO | ❌ **GAGAL** — tidak punya akses ubah client |
| 4 | Ubah status client jadi **Aktif** (dropdown di kanan atas) | **COO** | ✅ Berhasil, muncul "Status diubah ke Aktif" |
| 5 | Buat **Program pendampingan** baru | **CMO** | ✅ Berhasil |
| 6 | Isi program: nama, tujuan, tanggal mulai & target | CMO | ✅ Tersimpan |

## Pertanyaan diskusi
1. Kenapa langkah #2 gagal? Apa logikanya dari sisi bisnis?
2. Kenapa COO yang mengaktifkan, bukan CMO?
3. Apa yang terjadi kalau client dibiarkan ProsPek — fitur apa saja yang tidak bisa dipakai?

## ✅ Kriteria selesai
- Client berubah dari **Prospek** → **Aktif**
- Ada 1 program baru di bawah client itu
- Tim bisa menjelaskan **kenapa** program tidak bisa dibuat sebelum client aktif

---

# 📘 KASUS-2 — Client Aktif, Program Berjalan (Tingkat: Menengah)

## Situasi
**Konveksi Berkah Jaya** sudah jadi client aktif. Program **"Digitalisasi Produksi & Keuangan"** sedang berjalan dengan kondisi campuran:

| Task | Status | Prioritas | Catatan |
|---|---|---|---|
| Wawancara alur produksi | ✅ Selesai | Tinggi | — |
| Susun kartu HPP per SKU | 🔄 Dikerjakan | Tinggi | jatuh tempo 3 hari lagi |
| Kumpulkan nota bahan baku | 🚫 **Terhambat** | Urgent | nota belum diserahkan gudang, **sudah lewat 2 hari** |
| Susun draft SOP produksi | 📝 Belum mulai | Sedang | — |

Ada juga: 1 meeting sudah **Final**, 1 meeting masih **Draft**, 1 invoice **terbit belum dibayar**, 1 invoice masih **draft**, dan 1 biaya operasional (kunjungan lokasi).

## Yang harus dilakukan

### Bagian A — Menangani task terhambat
| # | Langkah | Login sebagai | Yang diharapkan |
|---|---|---|---|
| 1 | Buka menu **Pekerjaan**, filter yang **Terhambat** | CMO | Lihat 1 task BLOCKED + alasannya |
| 2 | Cari task overdue (lewat tanggal) | CMO | Lihat semuanya, catat mana yang lewat deadline |
| 3 | Coba **buka kembali** task yang sudah Selesai | CMO | ❌ **GAGAL** — hanya ADMIN/CEO yang boleh buka ulang |
| 4 | Sama seperti #3, login sebagai CEO | CEO | ✅ Berhasil |
| 5 | Ubah task "Susun kartu HPP" jadi **Selesai** | CMO | ✅ Berhasil |

### Bagian B — Menutup loop meeting
| # | Langkah | Login sebagai | Yang diharapkan |
|---|---|---|---|
| 6 | Buka **Catatan meeting** → cari yang masih **Draft** | COO | Ketemu "Review mingguan progres HPP" |
| 7 | Isi ringkasan + keputusan, lalu jadikan **Final** | COO | ✅ Berhasil |
| 8 | Coba buat action item tanpa mengisi apapun | COO | ❌ Ditolak |

### Bagian C — Alur uang
| # | Langkah | Login sebagai | Yang diharapkan |
|---|---|---|---|
| 9 | Buka **Invoice**, lihat yang sudah terbit | CFO | Lihat invoice LATIHAN/K2/0001, Rp 7.500.000 |
| 10 | Catat **pembayaran** sebagian (misal Rp 3.000.000) | CFO | ✅ Berhasil, saldo berkurang |
| 11 | Coba terbitkan invoice yang masih **Draft** | CFO | ✅ Berhasil (jika sudah disetujui) |
| 12 | Coba catat pembayaran **melebihi** sisa tagihan | CFO | ❌ **GAGAL** — sistem menolak kelebihan bayar |
| 13 | Coba akses Invoice sebagai CMO | CMO | ❌ **GAGAL** — tidak punya akses |
| 14 | Buka **Pengeluaran** | CMO | ✅ Bisa **lihat** |
| 15 | Coba **tambah** pengeluaran sebagai CMO | CMO | ❌ **GAGAL** — hanya ADMIN & CFO |

## Pertanyaan diskusi
1. Kenapa task terhambat butuh alasan? Apa gunanya untuk manajemen?
2. Kenapa CMO bisa *lihat* pengeluaran tapi tidak bisa *mengubah*?
3. Kalau ada salah input pembayaran, apa yang harus dilakukan? (petunjuk: cari fitur **void**)

## ✅ Kriteria selesai
- 1 task berpindah ke **Selesai**
- 1 meeting berubah **Draft** → **Final**
- 1 pembayaran tercatat, dan sistem **menolak** pembayaran berlebih
- Tim bisa menjelaskan perbedaan **lihat** vs **ubah** untuk keuangan

---

# 📕 KASUS-3 — Program Macet & Perlu Keputusan (Tingkat: Sulit)

## Situasi
**Toko Bangunan Sumber Rejeki** — program **"Perapian Pembukuan & Stok Gudang"** sudah **DITAHAN (On Hold)**.

**Masalahnya:** client sudah 3 kali diminta menyerahkan mutasi rekening dan data stok awal, tapi belum juga dikirim. Task pengumpulan data sudah terhambat **30 hari**.

Program ini butuh **keputusan**: dilanjutkan atau ditutup.

## Yang harus dilakukan

| # | Langkah | Login sebagai | Yang diharapkan |
|---|---|---|---|
| 1 | Cari program "Perapian Pembukuan & Stok Gudang" | CEO | Status **Ditahan**, ada alasan penahanan |
| 2 | Baca **risiko** program tersebut | CEO | Status **Perhatian**, skor kesehatan rendah |
| 3 | Cari task yang terhambat paling lama | CMO | Task "Minta mutasi rekening 6 bulan" — **30 hari lewat** |
| 4 | Buka **Catatan meeting** → rapat penanganan | CEO | Ketemu agenda keputusan lanjut/tutup |
| 5 | Finalkan meeting itu dengan keputusan | CEO | ✅ Berhasil |
| 6 | Ubah status program dari **Ditahan** → **Aktif** (lanjut) | CEO | ✅ Berhasil |
| 7 | **ATAU** ubah jadi **Dibatalkan** (tutup) + alasan | CEO | ✅ Berhasil |
| 8 | Cek **Action log** untuk melihat riwayat keputusan | CEO | ✅ Bisa lihat semua aktivitas |
| 9 | Coba akses Action log sebagai COO | COO | ❌ **GAGAL** — hanya ADMIN & CEO |
| 10 | Lihat riwayat aktivitas client (bukan action log global) | COO | ✅ Bisa, sesuai scope-nya |

## Pertanyaan diskusi
1. **Kapan** sebuah program sebaiknya ditutup, bukan terus dilanjutkan?
2. Apa bedanya **Action log** (menu Pengaturan) dengan **riwayat aktivitas client**?
3. Kalau program ditutup, bagaimana nasib invoice yang belum dibayar?
4. Data apa yang seharusnya diminta **di awal** supaya kasus ini tidak terulang?

## ✅ Kriteria selesai
- Meeting penanganan sudah **Final** dengan keputusan tertulis
- Status program sudah diubah (lanjut atau tutup) **dengan alasan**
- Tim bisa menjelaskan **kapan** program sebaiknya ditutup

---

# 📊 Ringkasan Perbandingan

| Aspek | KASUS-1 | KASUS-2 | KASUS-3 |
|---|---|---|---|
| **Tingkat** | Mudah | Menengah | Sulit |
| **Fokus** | Alur client baru | Operasional harian | Pengambilan keputusan |
| **Client** | Kedai Kopi Merdeka | Konveksi Berkah Jaya | Toko Bangunan Sumber Rejeki |
| **Status client** | Prospek | Aktif | Aktif |
| **Program** | Belum ada | Berjalan | **Ditahan** |
| **Jabatan utama** | COO, CMO | CMO, COO, CFO | CEO |
| **Pelajaran utama** | Urutan status | Batas izin & alur uang | Keputusan berbasis risiko |

---

# 💡 Panduan untuk Fasilitator

**Pembagian tim yang disarankan:**
- Bagikan per jabatan, biarkan tim merasakan perbedaan hak akses
- **Minta tim mencoba akses yang seharusnya gagal** — itu bagian terpenting
- Minta mereka mencatat pesan error yang muncul

**Pertanyaan penutup setelah semua kasus:**
1. Fitur mana yang paling membingungkan?
2. Alur mana yang menurut kalian salah urutan?
3. Informasi apa yang kalian cari tapi tidak ada?

> 💡 Jawaban dari 3 pertanyaan itu paling berguna untuk perbaikan app.

---

# ⚠️ Catatan Penting

**Data latihan ini nyata di sistem** dan ditandai dengan awalan **KASUS-1/2/3** supaya mudah dibedakan dari data asli.

**Kalau perlu direset** (misal setelah latihan berantakan), bilang saja — data bisa dikembalikan ke kondisi awal.

**Data latihan bisa memengaruhi laporan/statistik.** Kalau kamu butuh angka bersih untuk presentasi, minta dibersihkan dulu.
