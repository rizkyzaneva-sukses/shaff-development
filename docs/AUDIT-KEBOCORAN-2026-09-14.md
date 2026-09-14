# Audit akses data dan transaksi — 14 September 2026

## Cakupan

Audit statis terhadap route API, query Prisma, UI berdasarkan role, dan alur invoice/pembayaran. Matriks akses di `docs/PRD-Shaff-Development.md` menjadi acuan. Audit ini tidak memakai akun produksi dan tidak mengubah data live.

## Temuan yang diperbaiki

| Prioritas | Temuan | Perbaikan |
| --- | --- | --- |
| Kritis | Lead/Member dapat membaca dan mengunduh bukti pembayaran melalui API dokumen; daftar dokumen juga mengirim `storageKey`. | Filter kategori dan scope di query, pemeriksaan otorisasi terpusat untuk unduh/arsip/review, serta respons tanpa kunci penyimpanan. |
| Tinggi | Member dapat mengarsipkan dokumen unggahan orang lain; Finance dapat membaca dokumen operasional. | Member hanya dapat mengelola unggahannya sendiri; Finance hanya mengakses bukti pembayaran. |
| Tinggi | Lead menerima detail invoice, item, pembayaran, dan rekening lewat respons invoice/settings, melebihi ringkasan yang diizinkan PRD. | Respons invoice Lead hanya berisi ringkasan; PDF dibatasi pada Admin/Finance; rekening hanya dikirim ke Admin/Finance. |
| Tinggi | Finance dapat membaca task, meeting, client, detail program, ekspor operasional, dan progres melalui beberapa route. | Route operasional menolak Finance; daftar program untuk billing hanya mengirim identitas minimum; dashboard Finance hanya menghitung piutang. |
| Tinggi | Dua request pembayaran bersamaan bisa membaca saldo yang sama dan mencatat nominal melampaui total invoice. | Mutasi keuangan memakai transaksi serializable; konflik bersamaan dikembalikan sebagai HTTP 409 agar pengguna memuat ulang. |
| Sedang | Satu `Idempotency-Key` dapat dipakai lagi pada invoice berbeda dan mengembalikan hasil mutasi invoice lama. | Kunci kini divalidasi terhadap actor, operasi, dan ID invoice. |
| Sedang | Notifikasi dan aktivitas client dapat menyertakan detail invoice/dokumen di luar akses role. | Payload notifikasi invoice dipersempit; ID dokumen bukti pembayaran dan invoice dikeluarkan dari aktivitas Member. |

## Verifikasi dan batasan

- Pengujian matriks akses dokumen: 3 lulus.
- `npm run typecheck`, `npm run lint`, `npm run build`: lulus.
- `npm audit --omit=dev --audit-level=moderate`: 0 vulnerability.
- Integrasi transaksi bersamaan dengan PostgreSQL dan uji role terautentikasi di produksi belum dijalankan karena database dan akun produksi tidak tersedia di workspace. Deploy commit ini sebelum menganggap akses live sudah tertutup.
- Temuan metrik dashboard dan pagination task dari audit sebelumnya masih berlaku untuk role operasional; lihat `docs/AUDIT-2026-09-14.md`.
