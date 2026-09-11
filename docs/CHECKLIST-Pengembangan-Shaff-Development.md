# Checklist Pengembangan — Shaff Development

**Versi:** 1.0 · **Tanggal:** 11 September 2026  
**Acuan kebutuhan:** [PRD Shaff Development](PRD-Shaff-Development.md).  
**Status awal:** belum dikerjakan. Dokumen ini merupakan alat pelaksanaan, bukan bukti bahwa aplikasi sudah dibangun.

## Status implementasi kode — 11 September 2026

Fondasi aplikasi, API scoped, halaman utama, Settings, Audit Log, notifikasi, health/risk, template program, recurring task, approval invoice, export/import, Docker, serta script backup/restore sudah diimplementasikan dan divalidasi dengan `npm run lint`, `npm run typecheck`, `npm run build`, `npx prisma validate`, dan `npm audit --omit=dev --audit-level=moderate` (0 vulnerability). Checklist di bawah tetap harus diisi berdasarkan bukti staging karena validasi repository tidak menggantikan UAT, backup/restore rehearsal, load test, atau sign-off bisnis.

Item yang masih menunggu environment/pengguna: migration dan private volume EasyPanel, backup serta restore rehearsal nyata, load test, UAT CEO/COO/CMO/CTO/CFO, dan sign-off G0–G10.

## Cara memakai checklist

- Ikuti tahap berurutan sesuai dependensi. Tahap boleh berjalan bersamaan hanya jika tidak menunggu keputusan atau hasil tahap lain.
- Ubah setiap pekerjaan menjadi issue/task dengan satu PIC, target tanggal, referensi FR/AC/NFR, dan bukti hasil.
- Centang `[x]` hanya setelah hasil diverifikasi. Implementasi selesai tetapi belum diperiksa tetap belum selesai.
- Jika terhambat, tulis alasan, pemilik keputusan, dan tindak lanjut. Item yang tidak berlaku memerlukan alasan serta reviewer; jangan dicentang seolah sudah diuji.
- Gate adalah syarat untuk melanjutkan tahap berikutnya, bukan persetujuan ulang untuk setiap perubahan rutin.
- Perubahan kebutuhan memperbarui PRD, checklist, dan estimasi sebelum pekerjaan terdampak dilanjutkan.

Format task pelaksanaan:

```text
ID task:
Judul:
Referensi FR / AC / NFR / UAT:
PIC:
Reviewer:
Target tanggal:
Status: BELUM / DIKERJAKAN / REVIEW / TERHAMBAT / SELESAI
Lingkup dan hasil yang harus terlihat:
Dependensi / keputusan tertunda:
Bukti: tautan issue, PR, screenshot, laporan test, atau hasil UAT
Catatan:
```

## Tahap 0 — Penetapan kebutuhan

**PIC utama:** pemilik produk dan Lead operasional.

- [ ] Tetapkan pemilik produk, Tech Lead/developer, Lead operasional, Finance, reviewer/QA, dan PIC deployment; satu orang boleh memegang beberapa peran.
- [ ] Tinjau masalah, sasaran, dan alur utama PRD bersama perwakilan pengguna.
- [ ] Sahkan daftar termasuk/di luar MVP; pastikan tidak ada portal client, multi-tenant, ERP, atau payment gateway.
- [ ] Petakan contoh nyata client → program → task → meeting → invoice → pembayaran menggunakan data yang disamarkan.
- [ ] Sahkan matriks izin dan lingkup client/program, termasuk ringkasan keuangan yang boleh dilihat Lead (D-01).
- [ ] Tentukan nama/lokasi repository baru dan pengelolanya; jangan memakai schema/modul manufaktur (D-02).
- [ ] Sahkan alur penyelesaian task dan formula progress (D-03, D-04).
- [ ] Kumpulkan contoh invoice; pastikan kebutuhan pajak, diskon, dan koreksi sesuai cakupan atau ajukan perubahan (D-05).
- [ ] Catat anggaran, kapasitas tim, perkiraan volume data, dan target pilot (D-06, D-09).
- [ ] Buat daftar keputusan D-01–D-10 beserta PIC, tanggal batas, dan statusnya.
- [ ] Pecah FR-01–FR-11 menjadi backlog dengan AC, prioritas P0, dependensi, dan estimasi.
- [ ] Catat baseline operasional untuk mengevaluasi target empat minggu pilot.

**Gate G0:** PRD dan scope disahkan; D-01/D-02 selesai; keputusan tertunda mempunyai PIC dan tidak menghalangi pekerjaan berikutnya. Bukti: catatan persetujuan dan backlog bertanggal.

## Tahap 1 — Desain alur, UI, dan data

**PIC utama:** Tech Lead bersama Lead operasional dan Finance.

- [ ] Buat sitemap sesuai navigasi PRD dan matriks menu per role.
- [ ] Buat wireframe login, Dashboard, Pekerjaan Saya, daftar/detail client, program, task, meeting, dokumen, invoice, pembayaran, dan pengaturan.
- [ ] Siapkan desain mobile dan desktop untuk alur utama; tentukan empty, loading, error, forbidden, dan conflict state.
- [ ] Tetapkan bahasa label, format tanggal/rupiah, warna status, typography, spacing, dan komponen form/tabel.
- [ ] Pastikan board task dapat dipakai tanpa drag-and-drop dan semua form memiliki label serta fokus keyboard.
- [ ] Tinjau contoh cetak invoice, termasuk invoice multi-item yang melewati satu halaman.
- [ ] Buat ERD dari entitas PRD; pisahkan User internal dari ClientContact.
- [ ] Definisikan enum/status, field wajib, relasi, constraint unik, indeks awal, serta aturan arsip.
- [ ] Definisikan akses melalui ProgramMember dan Lead client; cek query daftar, detail, dashboard, dan unduhan.
- [ ] Tulis tabel transisi status program/task/client dan siapa yang berhak menjalankannya.
- [ ] Spesifikasikan formula progress, piutang, PARTIAL/PAID, overdue, dan contoh hitungan batas.
- [ ] Rancang nomor invoice unik, snapshot invoice, transaksi pembayaran, dan deduplikasi request.
- [ ] Rancang penanganan konflik edit agar pembaruan pengguna tidak hilang.
- [ ] Pilih library autentikasi, penyimpanan sesi, aktivasi/reset, dan pencabutan sesi; catat keputusan arsitektur.
- [ ] Pilih hosting, database, storage privat dan mekanisme upload/download; pastikan D-06/D-07 siap sebelum implementasinya.
- [ ] Tetapkan versi stack berdasarkan dokumentasi yang diperiksa saat implementasi; simpan lockfile dan keputusan runtime.
- [ ] Tinjau desain dengan perwakilan setiap role dan perbaiki alur yang membingungkan.

**Gate G1:** wireframe, ERD, aturan status, kontrak data, matriks izin, dan keputusan fondasi selesai ditinjau. Tidak ada pertanyaan mendasar tentang kepemilikan data atau perhitungan invoice.

## Tahap 2 — Repository dan fondasi aplikasi

**PIC utama:** developer/Tech Lead. **Acuan:** FR-01, FR-11, NFR-01–04.

- [ ] Buat repository baru yang disepakati, terpisah dari BOS/manufaktur.
- [ ] Tambahkan README setup, struktur modul, aturan kontribusi, dan contoh environment tanpa secrets.
- [ ] Inisialisasi Next.js, TypeScript, Tailwind, shadcn/ui, PostgreSQL, dan Prisma.
- [ ] Atur lockfile, scripts development/build/lint/typecheck/test, dan versi runtime.
- [ ] Siapkan environment development/staging/production yang terisolasi; jangan menaruh data production pada development.
- [ ] Buat schema/migration awal dan seed fiktif untuk keempat role, beberapa client/program, dan kasus batas.
- [ ] Uji migration pada database kosong serta proses menjalankan seed berulang sesuai prosedur.
- [ ] Terapkan CI untuk lint, typecheck, pengujian kritis, dan production build.
- [ ] Tetapkan kebijakan review/merge dan pencegahan secrets masuk repository.
- [ ] Implementasikan login/logout, aktivasi dan reset sekali pakai, ganti password, serta rate limit login.
- [ ] Implementasikan role dan pemeriksaan lingkup objek di server dengan default akses ditolak.
- [ ] Implementasikan penonaktifan, perubahan role, pencabutan sesi, dan pengalihan tanggung jawab sesuai PRD.
- [ ] Buat layout navigasi sesuai role, form dasar, toast/status, pagination, dan error boundary.
- [ ] Buat fondasi audit log, logging error aman, health check, serta penanganan request mutasi.
- [ ] Uji AC-01 dan percobaan akses tanpa sesi/role benar, termasuk URL langsung.
- [ ] Tetapkan dan dokumentasikan pemulihan akses Admin (D-10).

**Gate G2:** checkout baru dapat dijalankan dari README; CI lulus; staging dapat diakses; autentikasi serta pembatasan akses dasar terbukti bekerja.

## Tahap 3 — Client dan program pendampingan

**PIC utama:** developer; reviewer Lead operasional. **Acuan:** FR-02, FR-03, FR-11.

- [ ] Implementasikan daftar/detail/form client, pencarian, filter status/Lead, dan pagination.
- [ ] Implementasikan kontak utama, validasi kanal kontak, Lead aktif, dan peringatan potensi duplikat.
- [ ] Implementasikan status client, aturan INACTIVE/ARCHIVED, serta pemulihan arsip oleh Admin.
- [ ] Implementasikan program dengan jenis layanan, tujuan, deliverable, tanggal, dan anggota.
- [ ] Pastikan client program konsisten dan tidak dapat dipindah setelah mempunyai data turunan.
- [ ] Terapkan akses anggota melalui program dan Lead melalui client yang ditugaskan.
- [ ] Implementasikan transisi PLANNED/ACTIVE/ON_HOLD/COMPLETED/CANCELLED sesuai PRD.
- [ ] Implementasikan pengalihan assignment sebelum anggota dihapus atau akun dinonaktifkan.
- [ ] Tampilkan riwayat perubahan assignment/status yang dapat dibaca role terkait.
- [ ] Verifikasi AC-02 dan AC-03 dengan dua Lead dan anggota dari program berbeda, termasuk dua program pada client yang sama.

**Gate G3:** client dan program dapat dikelola sesuai role; data lintas program tidak bocor; validasi dan riwayat berjalan.

## Tahap 4 — Task, activity, dan progress

**PIC utama:** developer; reviewer Lead operasional. **Acuan:** FR-04, FR-05.

- [ ] Implementasikan task dengan satu assignee anggota aktif, prioritas, deadline, deskripsi, dan checklist opsional.
- [ ] Implementasikan Pekerjaan Saya dan daftar/board task dengan filter client/program/status/prioritas/deadline.
- [ ] Validasi alasan BLOCKED, hasil DONE, checklist, dan hak membatalkan/membuka kembali task.
- [ ] Terapkan peringatan deadline di luar program dan konfirmasi Lead/Admin.
- [ ] Implementasikan komentar dan activity log perubahan status, deadline, serta assignee.
- [ ] Terapkan larangan edit task pada program terminal dan pembatalan task aktif atomik saat program dibatalkan.
- [ ] Hitung progress program menggunakan DONE / non-CANCELLED; tampilkan kondisi tanpa task terukur.
- [ ] Hitung progress client dari gabungan task program ACTIVE/ON_HOLD.
- [ ] Pisahkan penanda overdue/blocked dari persentase progress dan status program.
- [ ] Implementasikan conflict detection pada pembaruan bersamaan; form dapat memuat versi terbaru.
- [ ] Uji AC-04/AC-05: nol task, semua CANCELLED, hasil 75%, buka kembali menjadi 50%, dan ukuran program berbeda.
- [ ] Uji deadline hari ini/besok/kemarin di Asia/Jakarta serta task overdue saat program ON_HOLD.
- [ ] Uji penutupan program, konfirmasi deliverable, dan pengecualian Admin saat tidak ada task terukur.

**Gate G4:** alur pekerjaan harian dapat dipakai ujung ke ujung; progress, izin perubahan, dan deadline sesuai data uji.

## Tahap 5 — Meeting dan dokumen

**PIC utama:** developer; reviewer Lead operasional. **Acuan:** FR-06, FR-07, NFR-01.

- [ ] Implementasikan meeting DRAFT/FINAL, peserta, ringkasan, keputusan, dan tindak lanjut.
- [ ] Finalisasi mewajibkan setiap tindak lanjut mempunyai task atau alasan tidak dibuat.
- [ ] Implementasikan pembuatan task dari tindak lanjut dengan validasi assignee/deadline dan deduplikasi.
- [ ] Tautkan meeting dengan task dua arah; terapkan koreksi FINAL beralasan dan audit.
- [ ] Terapkan storage privat dan metadata dokumen per program/client.
- [ ] Terapkan allowlist format, batas ukuran 20 MB yang disahkan, pemeriksaan tipe file server, dan storage key aman.
- [ ] Implementasikan unggah, daftar/filter, unduh attachment, arsip, dan versi pengganti sebagai unggahan baru.
- [ ] Periksa izin unduhan dan masa berlaku URL sementara jika digunakan.
- [ ] Tangani unggahan gagal, metadata gagal disimpan, file hilang, serta retry tanpa hasil palsu/duplikat.
- [ ] Terapkan pembatasan bukti pembayaran khusus Admin/Finance melalui mekanisme file yang sama.
- [ ] Verifikasi AC-06/AC-07, termasuk URL tebakan, file ekstensi palsu, file besar, dan user yang baru dicabut aksesnya.

**Gate G5:** hasil konsultasi dapat ditindaklanjuti; file dapat diakses pihak berhak; skenario akses negatif dan kegagalan storage lulus.

## Tahap 6 — Invoice dan pembayaran

**PIC utama:** developer; reviewer Finance. **Acuan:** FR-08, FR-09, FR-11.

- [ ] Pastikan D-05 sudah disahkan berdasarkan format penagihan yang akan dipakai.
- [ ] Implementasikan profil penagihan organisasi dan rekening dengan hak Admin.
- [ ] Implementasikan draft invoice, item, tanggal, jatuh tempo, catatan, dan validasi client–program.
- [ ] Hitung rupiah bulat secara tepat; kuantitas positif, harga tidak negatif, dan total terbit positif.
- [ ] Implementasikan penerbitan atomik, nomor unik tahunan, dan idempotensi request.
- [ ] Simpan snapshot identitas, rekening, item, dan nominal saat invoice terbit.
- [ ] Kunci invoice terbit dari edit/hapus; implementasikan pembatalan beralasan dan hubungan invoice pengganti.
- [ ] Blokir pembatalan invoice dengan pembayaran valid; jelaskan bahwa void hanya koreksi pencatatan.
- [ ] Buat tampilan cetak dan uji simpan PDF melalui browser, termasuk invoice lebih dari satu halaman.
- [ ] Implementasikan pembayaran manual dan bukti privat, termasuk pembayaran sebagian.
- [ ] Terapkan saldo, UNPAID/PARTIAL/PAID, penanda OVERDUE, serta pengecualian DRAFT/CANCELLED.
- [ ] Terapkan transaksi untuk mencegah overpayment bersamaan dan deduplikasi request pembayaran.
- [ ] Implementasikan void dengan alasan/audit; pembayaran tidak dapat diedit atau dihapus permanen.
- [ ] Terapkan akses rincian keuangan Admin/Finance, ringkasan Lead dalam lingkup, dan penolakan akses Anggota Tim.
- [ ] Uji AC-08/AC-09 dengan urutan Rp1.000.000 → bayar Rp400.000 → bayar Rp600.000 → void Rp400.000.
- [ ] Uji dua penerbitan dan dua pembayaran bersamaan, klik ulang, nilai nol/negatif, dan nominal melebihi saldo.
- [ ] Finance mencocokkan cetak, ledger pembayaran, saldo, serta audit dengan contoh perhitungan manual.

**Gate G6:** Finance menyatakan alur tagihan dan koreksi sesuai; tidak ada saldo negatif, nomor ganda, atau bukti pembayaran yang terbuka tanpa izin.

## Tahap 7 — Dashboard dan integrasi

**PIC utama:** developer dan QA. **Acuan:** FR-10, FR-11.

- [ ] Implementasikan dashboard sesuai empat role dengan lingkup query yang konsisten.
- [ ] Tampilkan client aktif, program ACTIVE/ON_HOLD, task overdue/blocked, dan pekerjaan jatuh tempo sesuai PRD.
- [ ] Tampilkan progress client serta next action yang membuka task/program terkait.
- [ ] Tampilkan piutang, invoice overdue, dan penerimaan valid sesuai tanggal pembayaran untuk Finance/Admin.
- [ ] Pastikan invoice program selesai tetap masuk piutang bila belum lunas.
- [ ] Hubungkan metrik ke daftar berfilter yang identik dan gunakan pagination.
- [ ] Uji pembaruan data setelah task selesai, program berubah, pembayaran masuk, serta pembayaran di-void.
- [ ] Pastikan dashboard/search tidak membocorkan nama, jumlah, atau cuplikan objek di luar izin.
- [ ] Verifikasi AC-10 dan AC-11, termasuk arsip client yang masih mempunyai kewajiban dan audit append-only.
- [ ] Jalankan satu skenario lengkap dari pembuatan client hingga program selesai dan invoice lunas.

**Gate G7:** semua metrik cocok dengan daftar rinci dan hitungan manual pada dataset uji; alur antarmodul konsisten.

## Tahap 8 — QA, keamanan, performa, dan pemulihan

**PIC utama:** QA/reviewer dan Tech Lead. **Acuan:** seluruh AC dan NFR.

- [ ] Jalankan lint, typecheck, build, dan test pada commit calon rilis; simpan hasil CI.
- [ ] Uji fungsi bisnis kritis: transisi status, progress, jumlah invoice, saldo, overdue, dan koreksi pembayaran.
- [ ] Uji integrasi dengan PostgreSQL untuk constraints, transaksi, konkurensi, dan migration.
- [ ] Uji semua kombinasi akses penting melalui UI dan request server langsung, termasuk IDOR lintas client/program/file.
- [ ] Uji sesi dicabut, akun nonaktif, reset token terpakai/kedaluwarsa, login gagal, dan pengalihan tanggung jawab.
- [ ] Uji input tidak valid, request mutasi tanpa izin, file terlarang, dan duplikasi submit.
- [ ] Uji viewport 360/768/1440 px dan browser yang disepakati; dokumentasikan perangkat yang digunakan.
- [ ] Uji keyboard, label form, fokus, kontras, informasi status tanpa warna, dan board tanpa drag.
- [ ] Uji loading/empty/error/forbidden, jaringan gagal, konflik edit, serta perubahan belum tersimpan.
- [ ] Siapkan dataset skala NFR-02 dan uji 20 pengguna bersamaan; catat p95 serta profil jaringan/staging.
- [ ] Perbaiki query/index yang gagal target dan uji ulang skenario terdampak.
- [ ] Verifikasi HTTPS, cookies, penyimpanan secrets, privacy storage, dan log tanpa data sensitif.
- [ ] Terapkan backup database/file, retensi yang disahkan, serta notifikasi kegagalan backup kepada PIC.
- [ ] Jalankan restore database dan file ke lingkungan terpisah; verifikasi sampel record, file, relasi, saldo, dan akses.
- [ ] Catat RPO/RTO aktual dan bandingkan dengan target yang disahkan (D-08).
- [ ] Latih proses deployment, migration, rollback aplikasi, dan pemulihan data; jangan menganggap rollback kode memperbaiki schema.
- [ ] Triage bug: kritis/tinggi wajib selesai; bug minor yang ditunda memiliki PIC, tenggat, dan penerimaan risiko.

**Gate G8:** semua uji kritis dan target NFR lulus; restore terbukti; tidak ada bug yang menghalangi alur utama, merusak saldo/data, atau membuka akses tidak sah.

## Tahap 9 — UAT dan pilot internal

**PIC utama:** pemilik produk, Lead, Finance, dan perwakilan Anggota Tim.

- [ ] Pilih pengguna pilot dari setiap role dan dataset yang disetujui; gunakan data nyata hanya setelah kontrol akses/backup siap.
- [ ] Tetapkan tanggal, fasilitator, dan pencatat hasil UAT.
- [ ] Jalankan UAT-01–UAT-13 dari PRD dan catat hasil serta bukti pada matriks di bawah.
- [ ] Uji skenario tanpa bantuan developer untuk mengukur kemudahan penggunaan.
- [ ] Catat bug dan permintaan baru secara terpisah; kebutuhan di luar MVP masuk change request.
- [ ] Perbaiki temuan yang memblokir dan uji ulang skenario terdampak.
- [ ] Buat panduan singkat Admin, Lead, Anggota Tim, dan Finance serta SOP koreksi pembayaran.
- [ ] Latih pengguna memasukkan task, hasil meeting, dokumen, dan pembayaran secara konsisten.
- [ ] Tetapkan kanal pelaporan kendala dan PIC respons selama pilot.
- [ ] Pemilik produk memberi sign-off operasional; Finance memberi sign-off penagihan dan saldo.

**Gate G9:** UAT kritis lulus dengan bukti dan sign-off; pengguna dapat menjalankan alur harian; temuan minor memiliki rencana penanganan.

## Tahap 10 — Rilis produksi dan evaluasi

**PIC utama:** Tech Lead dan pemilik produk.

- [ ] Tetapkan commit/tag rilis, release notes, jadwal deployment, PIC, dan kondisi pembatalan/rollback.
- [ ] Periksa secrets, domain, HTTPS, koneksi database, storage, monitoring, dan akun Admin production.
- [ ] Pastikan data demo/test tidak masuk production; siapkan master awal yang telah disetujui.
- [ ] Buat backup pra-rilis bila environment sudah berisi data; verifikasi rencana migration dan pemulihan.
- [ ] Deploy artefak rilis yang sudah diuji dan jalankan migration sesuai runbook.
- [ ] Jalankan smoke test login, client, program, task, unggah/unduh, invoice/cetak, pembayaran, dan dashboard dengan data uji yang ditandai serta prosedur pembersihan yang menjaga audit.
- [ ] Pastikan hak akses setiap role benar dan user nonaktif tidak dapat mengakses aplikasi.
- [ ] Verifikasi job backup pertama, error logging, health check, dan penerima alert.
- [ ] Serahkan README, panduan pengguna, runbook deployment/restore, daftar PIC, serta daftar masalah tersisa.
- [ ] Pantau error, akses, unggahan, saldo, dan feedback selama minggu pertama; tetapkan jadwal peninjauan oleh tim.
- [ ] Evaluasi sasaran PRD setelah empat minggu pemakaian aktif menggunakan baseline dan data nyata.
- [ ] Prioritaskan perbaikan berdasarkan temuan; fitur lanjutan membutuhkan scope dan estimasi baru.

**Gate G10:** production sehat, smoke test lulus, pemilik operasional menerima serah terima, dan penanggung jawab dukungan aktif.

## Matriks penelusuran kebutuhan

| Kebutuhan | Tahap implementasi | UAT utama | Bukti / issue | Status |
|---|---|---|---|---|
| FR-01 / AC-01 — akun dan login | 2 | UAT-01, UAT-10 | Belum ada | BELUM |
| FR-02 / AC-02 — client | 3 | UAT-02, UAT-10 | Belum ada | BELUM |
| FR-03 / AC-03 — program | 3–4 | UAT-02, UAT-11 | Belum ada | BELUM |
| FR-04 / AC-04 — task | 4 | UAT-03, UAT-12 | Belum ada | BELUM |
| FR-05 / AC-05 — progress | 4 | UAT-04 | Belum ada | BELUM |
| FR-06 / AC-06 — meeting | 5 | UAT-05 | Belum ada | BELUM |
| FR-07 / AC-07 — dokumen | 5 | UAT-06 | Belum ada | BELUM |
| FR-08 / AC-08 — invoice | 6 | UAT-07 | Belum ada | BELUM |
| FR-09 / AC-09 — payment | 6 | UAT-08, UAT-09 | Belum ada | BELUM |
| FR-10 / AC-10 — dashboard | 7 | UAT-09, UAT-10, UAT-12 | Belum ada | BELUM |
| FR-11 / AC-11 — audit/arsip | 2–7 | UAT-03, UAT-08, UAT-11 | Belum ada | BELUM |
| NFR-01 — keamanan | 2, 5–8 | UAT-01, UAT-06, UAT-10 | Belum ada | BELUM |
| NFR-02 — performa | 7–8 | Uji beban tahap 8 | Belum ada | BELUM |
| NFR-03 — pemulihan | 8, 10 | UAT-13 | Belum ada | BELUM |
| NFR-04 — kualitas/responsive | 1–2, 8 | UAT-12 + CI | Belum ada | BELUM |

## Lembar hasil UAT

Status hanya diubah menjadi LULUS setelah hasil aktual dan bukti diisi. SKIP bukan LULUS.

| Skenario | Penguji / tanggal | Hasil aktual dan bukti | Bug terkait | Status |
|---|---|---|---|---|
| UAT-01 | — | — | — | BELUM |
| UAT-02 | — | — | — | BELUM |
| UAT-03 | — | — | — | BELUM |
| UAT-04 | — | — | — | BELUM |
| UAT-05 | — | — | — | BELUM |
| UAT-06 | — | — | — | BELUM |
| UAT-07 | — | — | — | BELUM |
| UAT-08 | — | — | — | BELUM |
| UAT-09 | — | — | — | BELUM |
| UAT-10 | — | — | — | BELUM |
| UAT-11 | — | — | — | BELUM |
| UAT-12 | — | — | — | BELUM |
| UAT-13 | — | — | — | BELUM |

## Catatan keputusan dan perubahan scope

Gunakan format berikut untuk D-01–D-10 serta perubahan berikutnya. Tidak perlu meminta persetujuan ulang untuk pekerjaan yang sudah tercakup dalam keputusan yang berlaku.

```text
ID keputusan / change request:
Tanggal dan pengusul:
Masalah atau kebutuhan:
Usulan keputusan:
Bagian PRD / checklist terdampak:
Dampak waktu, biaya, data, akses, dan testing:
Pilihan yang dipertimbangkan:
Keputusan: DISETUJUI / DITUNDA / DITOLAK
Pemilik keputusan dan tanggal:
Issue tindak lanjut:
```

## Catatan sign-off gate

| Gate | Pihak peninjau | Nama / tanggal | Bukti | Status |
|---|---|---|---|---|
| G0 — kebutuhan | Pemilik produk + Lead | — | — | BELUM |
| G1 — desain | Tech Lead + Lead + Finance | — | — | BELUM |
| G2 — fondasi | Tech Lead / reviewer | — | — | BELUM |
| G3 — client/program | Lead + reviewer | — | — | BELUM |
| G4 — task/progress | Lead + reviewer | — | — | BELUM |
| G5 — meeting/dokumen | Lead + reviewer | — | — | BELUM |
| G6 — keuangan | Finance + reviewer | — | — | BELUM |
| G7 — integrasi | QA / reviewer | — | — | BELUM |
| G8 — QA/pemulihan | QA + Tech Lead | — | — | BELUM |
| G9 — UAT | Pemilik produk + Lead + Finance | — | — | BELUM |
| G10 — produksi | Pemilik produk + Tech Lead | — | — | BELUM |

## Checklist ekstensi P1

- [x] Notifikasi task overdue dan meeting mendatang — `/api/notifications`, `/dashboard/notifications`.
- [x] Reminder invoice jatuh tempo — scope Finance/Admin/Lead; Member ditolak.
- [x] Template program dan apply task — `/dashboard/templates`.
- [x] Recurring task dan runner — `/dashboard/recurring`, `/api/recurring-task-rules/run`.
- [x] Kalender meeting — toggle kalender pada `/dashboard/meetings`.
- [x] Client health score dan risiko program — `/api/programs/:id/health`.
- [x] Export laporan CSV/Excel-compatible — clients, tasks, invoices, program health.
- [x] Cetak/PDF browser untuk laporan health — tombol `Cetak / PDF`.
- [x] Bulk import client dan kontak — `/api/clients/import`.
- [x] Approval workflow deliverable dan invoice — review dokumen serta approval invoice sebelum issue.
- [x] Activity timeline per client — `/api/clients/:id/activity` dan detail client.

## Prosedur kerja per fitur

1. Ambil issue yang memenuhi Definition of Ready dari PRD.
2. Buat branch sesuai kebijakan repository dan implementasikan dalam lingkup issue.
3. Tambahkan atau jalankan pengujian yang membuktikan aturan bisnis, akses, serta risiko perubahan; perubahan visual kecil cukup diverifikasi secara visual bila tidak mengubah perilaku.
4. Jalankan check yang relevan dan lakukan self-review; jangan menyertakan secrets atau data client nyata pada PR.
5. Buat PR berisi masalah, perilaku akhir, FR/AC, bukti verifikasi, dan dampak migration bila ada.
6. Reviewer memeriksa perilaku, izin, integritas data, serta bukti; perbaiki temuan sebelum merge.
7. Deploy ke staging, verifikasi AC dengan role yang relevan, dan lampirkan bukti pada issue/checklist.
8. Centang selesai hanya ketika Definition of Done terpenuhi; rilis mengikuti gate proyek.
