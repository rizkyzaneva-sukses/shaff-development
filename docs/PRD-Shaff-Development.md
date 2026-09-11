# PRD — Shaff Development

**Produk:** aplikasi operasional internal untuk pendampingan dan digitalisasi sistem bisnis client UMKM.  
**Versi:** 1.0 — draft siap ditinjau, belum merupakan persetujuan stakeholder.  
**Tanggal:** 11 September 2026.  
**Pemilik produk:** pimpinan Shaff Development; nama penanggung jawab perlu ditetapkan.  
**Dokumen pelaksanaan:** [Checklist pengembangan](CHECKLIST-Pengembangan-Shaff-Development.md).

## 1. Ringkasan produk

Shaff Development membantu tim internal mengelola client, program pendampingan, pekerjaan harian, hasil konsultasi, dokumen, serta tagihan dalam satu aplikasi. Tim dapat melihat siapa mengerjakan apa, kapan pekerjaan harus selesai, kendala yang perlu ditangani, dan perkembangan setiap client.

Aplikasi dibangun dari awal dalam repository baru. Schema database dan modul manufaktur tidak digunakan ulang. Stack yang disepakati: Next.js, PostgreSQL, Prisma, Tailwind CSS, dan shadcn/ui. Antarmuka harus dapat digunakan di perangkat mobile dan desktop.

## 2. Masalah yang diselesaikan

1. Informasi client dan pekerjaan tersebar sehingga sulit menemukan konteks terakhir.
2. Penanggung jawab dan deadline pekerjaan tidak selalu jelas.
3. Progress pendampingan sulit dibandingkan dengan pekerjaan yang benar-benar selesai.
4. Hasil meeting tidak konsisten ditindaklanjuti menjadi task.
5. Dokumen dan riwayat konsultasi sulit ditelusuri.
6. Invoice, pembayaran sebagian, dan piutang belum terlihat dalam satu tampilan operasional.

## 3. Sasaran dan ukuran keberhasilan

Angka berikut merupakan usulan target pilot, bukan hasil pengukuran. Evaluasi setelah empat minggu pemakaian aktif. Besaran target disahkan pada tahap penetapan kebutuhan.

| Sasaran | Definisi pengukuran | Usulan target |
|---|---|---|
| Pekerjaan dapat ditelusuri | Task aktif memiliki client, program, assignee, dan deadline | 100% |
| Data client siap dipakai | Client aktif memiliki PIC internal dan minimal satu kontak utama | 100% |
| Tindak lanjut meeting tertib | Meeting berstatus selesai memiliki ringkasan; setiap tindak lanjut memiliki task atau alasan tidak dibuat | ≥90% |
| Tim memakai aplikasi | Anggota aktif melakukan minimal satu pembaruan pekerjaan per minggu | ≥80% |
| Status tagihan konsisten | Saldo invoice sama dengan total tagihan dikurangi pembayaran valid | 100% |
| Informasi mudah ditemukan | Peserta UAT menemukan status client dan next action tanpa bantuan | ≤2 menit pada ≥90% skenario |

Jumlah client, anggota tim, dan program awal dicatat sebelum pilot untuk menjadi baseline. Target tidak dianggap lulus tanpa data dan bukti pengukuran.

## 4. Pengguna dan hak akses

MVP melayani satu organisasi internal: Shaff Development. Tidak ada tenant, pendaftaran publik, atau akun client.

| Area / tindakan | Admin | Lead / Koordinator | Anggota Tim | Finance |
|---|---|---|---|---|
| Akun, role, profil organisasi | Kelola | — | Profil sendiri | Profil sendiri |
| Client dan kontak | Semua | Client yang ditugaskan | Baca client pada program yang diikuti | Baca identitas penagihan |
| Membuat client dan menunjuk lead | Ya | — | — | — |
| Program dan anggota program | Semua | Kelola pada client yang ditugaskan | Baca program yang diikuti | Baca ringkasan untuk penagihan |
| Task dan activity | Semua | Kelola dalam lingkupnya | Buat dalam program yang diikuti; ubah task milik sendiri | — |
| Catatan meeting | Semua | Kelola dalam lingkupnya | Baca dalam lingkup; kelola catatan sendiri | — |
| Dokumen operasional | Semua | Kelola dalam lingkupnya | Baca dalam lingkup; unggah dan kelola unggahan sendiri | — |
| Invoice dan pembayaran | Semua | Baca ringkasan status dalam lingkupnya | — | Kelola semua |
| Dashboard | Seluruh operasional dan keuangan | Operasional dalam lingkup dan ringkasan tagihan | Pekerjaan dalam lingkup | Keuangan |
| Audit trail | Semua | Riwayat operasional dalam lingkup | Riwayat task dalam lingkup | Riwayat keuangan |

Aturan akses:

- Satu akun memiliki satu role pada MVP. Admin dapat sekaligus menjalankan tugas operasional atau finance.
- Lead ditugaskan per client. Anggota Tim mendapat akses melalui keanggotaan program; hal ini tidak membuka program lain milik client yang sama.
- Profil dasar client dan kontak dapat dibaca anggota program terkait. Catatan dan dokumen yang bersifat pekerjaan wajib terkait program agar pembatasan akses jelas.
- Lead hanya melihat nomor invoice, total, jatuh tempo, saldo, dan status; rincian bukti pembayaran hanya Admin dan Finance.
- Pemeriksaan izin wajib dilakukan di server, termasuk unduhan dokumen, pencarian, dashboard, dan akses melalui URL langsung.
- Akun nonaktif tidak dapat masuk atau memakai sesi lama. Riwayat pekerjaan tetap tersimpan. Penonaktifan diblokir jika masih ada task aktif atau tanggung jawab aktif yang belum dialihkan.
- Menghapus anggota program atau mengganti assignee harus menjaga invariant bahwa semua task aktif mempunyai assignee aktif yang menjadi anggota program tersebut.

## 5. Cakupan MVP

### Termasuk

1. Login internal dan pengelolaan akun serta role.
2. Master client UMKM dan kontak client.
3. Program pendampingan / project per client dan anggota pelaksananya.
4. Task, checklist sederhana, komentar, deadline, serta activity log.
5. Progress program dan ringkasan progress client.
6. Catatan meeting / konsultasi beserta tindak lanjut.
7. Unggah, unduh, dan arsip dokumen client dalam konteks program.
8. Invoice dan pencatatan pembayaran manual, termasuk pembayaran sebagian.
9. Dashboard operasional sesuai role, pencarian, dan filter.
10. Audit tindakan penting, backup, dan prosedur pemulihan.

### Di luar MVP

- Portal atau login client, multi-tenant, dan beberapa organisasi dalam satu instalasi.
- Payment gateway, sinkronisasi bank, rekonsiliasi otomatis, dan akuntansi umum.
- ERP/manufaktur, persediaan, pembelian, penggajian, dan HR lengkap.
- CRM pemasaran, pipeline penjualan kompleks, kampanye, serta otomasi WhatsApp/email.
- Kontrak elektronik, tanda tangan digital, pajak otomatis, refund, credit note, dan multi-currency.
- Time tracking, Gantt, task dependency, recurring task, dan template program otomatis.
- Chat realtime, notifikasi push, aplikasi mobile native, dan kemampuan offline.
- Migrasi schema atau modul aplikasi BOS lama.

Kebutuhan di luar daftar termasuk harus masuk change request. Jangan menyisipkannya ke sprint tanpa evaluasi dampak.

### Ekstensi P1 yang disetujui setelah MVP stabil

Atas keputusan operasional terbaru, backlog P1 berikut menjadi ekstensi resmi setelah gate MVP: notifikasi task overdue dan meeting, reminder invoice jatuh tempo, template program, recurring task, kalender meeting, health score dan risiko program, export PDF/Excel (export CSV tersedia lebih dulu), bulk import client/kontak, approval workflow deliverable dan invoice, serta activity timeline per client. Ekstensi ini tetap mengikuti role/scope yang sama dan tidak mengubah batas portal client, multi-tenant, payment gateway, atau ERP.

## 6. Model domain dan relasi

Alur utama:

**Tim → Client → Program Pendampingan → Task / Activity → Progress**  
**Client + Program Pendampingan → Invoice → Payment**

Invoice melekat pada program dan client; penerbitannya tidak wajib menunggu semua task selesai.

| Entitas | Data pokok | Relasi dan aturan |
|---|---|---|
| User | Nama, email unik, role, status aktif | Anggota internal; tidak ada User client |
| OrganizationSettings | Nama usaha, logo opsional, alamat, kontak, rekening pembayaran | Satu profil organisasi |
| Client | Nama usaha, sektor, alamat opsional, status, lead, catatan profil | Memiliki banyak kontak dan program |
| ClientContact | Nama, jabatan opsional, email/telepon, penanda kontak utama | Milik satu client; minimal satu kanal kontak |
| Program | Nama, jenis layanan, tujuan, deliverable, tanggal mulai/target, status | Milik satu client; dapat memiliki banyak invoice |
| ProgramMember | Program dan user | Kombinasi unik; menentukan akses Anggota Tim |
| Task | Judul, deskripsi, status, prioritas, assignee, deadline, hasil penyelesaian | Milik satu program; satu assignee; checklist opsional |
| TaskChecklistItem | Label, urutan, selesai/belum | Mendukung task; tidak dihitung sebagai task progress terpisah |
| TaskComment / ActivityLog | Isi/peristiwa, aktor, waktu | Komentar kolaborasi terpisah dari audit sistem |
| MeetingNote | Judul, waktu, peserta, ringkasan, keputusan, status | Wajib satu client dan satu program yang cocok |
| MeetingActionItem | Uraian, task terkait atau alasan tidak dibuat | Task tindak lanjut harus dalam program yang sama |
| Document | Nama tampilan, storage key, ukuran, MIME, kategori, pengunggah, waktu, status arsip | Milik satu program dan client terkait; file bersifat privat |
| Invoice | Nomor, tanggal terbit/jatuh tempo, status dokumen, snapshot identitas, total, referensi invoice yang digantikan bila ada | Satu client dan satu program yang cocok |
| InvoiceItem | Deskripsi jasa, kuantitas, harga satuan, jumlah | Milik satu invoice |
| Payment | Invoice, nominal, tanggal, metode, referensi, bukti opsional, pencatat, status void | Banyak pembayaran per invoice |
| AuditLog | Aktor, aksi, objek, perubahan yang relevan, waktu, alasan bila diwajibkan | Append-only bagi pengguna aplikasi; tidak menyimpan password/token |

Semua entitas utama memiliki ID stabil dan timestamp. Field audit ditambahkan sesuai kebutuhan. Relasi historis tidak boleh terhapus akibat penghapusan user, client, atau program. Struktur ini adalah rancangan logis; schema Prisma final disusun dan ditinjau pada tahap desain teknis.

## 7. Alur penggunaan utama

### A. Onboarding client

1. Admin membuat client berstatus `PROSPECT`, kontak utama, dan memilih Lead.
2. Lead melengkapi konteks bisnis dan kebutuhan pendampingan.
3. Lead membuat program, tujuan, deliverable, tanggal, dan anggota program.
4. Client diaktifkan ketika mulai dilayani; program diaktifkan ketika siap dikerjakan.
5. Lead membuat task, memilih assignee, prioritas, dan deadline.

### B. Pelaksanaan pendampingan

1. Anggota membuka Pekerjaan Saya untuk melihat task berdasarkan deadline.
2. Anggota memperbarui task dan menambahkan komentar atau kendala.
3. Hasil konsultasi dicatat sebagai meeting; tindak lanjut dibuat menjadi task yang tertaut.
4. Dokumen hasil pekerjaan diunggah ke program.
5. Task selesai memperbarui progress program; Lead memeriksa hasil dan kendala.

### C. Penagihan

1. Finance memilih client dan program, membuat draft invoice, serta mengisi item jasa.
2. Finance memeriksa identitas penagihan, nominal, rekening, dan jatuh tempo.
3. Invoice diterbitkan dan mendapatkan nomor unik. Tampilan cetak tersedia untuk disimpan sebagai PDF melalui browser.
4. Pengiriman invoice dilakukan manual di luar aplikasi pada MVP.
5. Finance mencatat pembayaran, termasuk cicilan dan bukti bila tersedia.
6. Sistem menghitung saldo dan status pembayaran; piutang tampil pada dashboard Finance.

### D. Penutupan program

1. Lead memastikan seluruh task tidak lagi aktif dan deliverable terpenuhi.
2. Lead menulis ringkasan hasil serta tanggal selesai aktual, lalu menyelesaikan program.
3. Pembayaran boleh masih berjalan setelah pekerjaan selesai; status program dan pelunasan dicatat terpisah.
4. Data historis tetap dapat ditelusuri. Pengarsipan bukan penghapusan riwayat.

## 8. Kebutuhan fungsional dan kriteria penerimaan

### FR-01 — Login dan akun internal — P0

- Login menggunakan email dan password; tidak ada registrasi publik.
- Admin membuat akun dan mengelola status serta role. Aktivasi/reset memakai tautan sekali pakai dengan masa berlaku; penyampaian tautan dilakukan manual melalui kanal internal pada MVP.
- Token aktivasi/reset tidak disimpan sebagai teks asli, tidak dicatat di log, dan tidak dapat digunakan ulang. Password tidak pernah dikirim atau ditampilkan kembali.
- Pengguna dapat logout dan mengganti password sendiri. Reset password atau perubahan role mencabut sesi yang terdampak.
- **AC-01:** akun aktif dapat login/logout; kredensial salah menghasilkan pesan generik; token kedaluwarsa/terpakai ditolak; akun nonaktif dan sesi yang dicabut gagal mengakses API.

### FR-02 — Client dan kontak — P0

- Daftar client mendukung pencarian nama usaha/kontak, filter status dan Lead, serta pagination.
- Profil client menampilkan kontak, program yang boleh diakses, activity terbaru, dan ringkasan keuangan sesuai role.
- Client aktif wajib memiliki Lead aktif dan satu kontak utama. Tepat satu kontak ditandai utama.
- Nama usaha sama menampilkan peringatan kemungkinan duplikat; tidak otomatis digabung karena dapat mewakili usaha berbeda.
- **AC-02:** Admin dapat membuat client dan menunjuk Lead; Lead hanya mengelola client yang ditugaskan; anggota tidak dapat membaca client yang tidak terkait; validasi kontak dan pencarian bekerja.

### FR-03 — Program pendampingan — P0

- Jenis layanan awal: Pendampingan Bisnis, Digitalisasi Sistem, dan Gabungan.
- Program mempunyai tujuan, deliverable, tanggal mulai, target selesai, status, dan anggota aktif.
- Target selesai tidak boleh lebih awal daripada tanggal mulai. Program aktif wajib memiliki minimal satu anggota.
- Tampilan detail memuat ringkasan, task, meeting, dokumen, riwayat, dan invoice sesuai izin.
- **AC-03:** Lead dapat membuat dan mengatur program dalam lingkupnya; relasi client konsisten; akses lintas program ditolak; penyelesaian program mematuhi aturan pada bagian 9.

### FR-04 — Task dan pekerjaan harian — P0

- Task wajib memiliki judul, program, satu assignee aktif yang menjadi anggota program, prioritas, dan deadline.
- Status: `TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`, `CANCELLED`. Prioritas: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- Tersedia tampilan daftar dan board sederhana dengan menu ubah status yang tetap dapat digunakan tanpa drag-and-drop.
- Task yang dibuat Anggota Tim otomatis ditugaskan kepada dirinya sendiri. Lead/Admin dapat membuat dan menugaskan task kepada anggota program lain.
- Pekerjaan Saya mendukung filter deadline, client, program, prioritas, dan status. Assignee tidak dapat mengalihkan task sendiri tanpa hak Lead/Admin.
- `BLOCKED` wajib memiliki alasan. `DONE` wajib memiliki ringkasan hasil; seluruh checklist harus selesai atau dihapus dengan riwayat tercatat.
- **AC-04:** anggota mengubah task milik sendiri; perubahan task rekan ditolak; deadline lewat terdeteksi tepat; alasan blocked dan hasil selesai divalidasi; dua pembaruan bersamaan tidak diam-diam saling menimpa.

### FR-05 — Progress dan kesehatan program — P0

- Progress dihitung otomatis dari task, bukan angka yang diisi bebas.
- Progress program = jumlah task `DONE` / jumlah task selain `CANCELLED` × 100%, dengan bobot setiap task sama.
- Jika penyebut nol, tampilkan “Belum ada task terukur”; jangan menampilkan 100% atau menyimpulkan program selesai.
- Ringkasan progress client memakai gabungan task dari program `ACTIVE` dan `ON_HOLD`, bukan rata-rata persentase program. Client tanpa task terukur menampilkan kondisi kosong.
- Task overdue dan blocked tampil sebagai indikator terpisah. Progress 100% tidak otomatis mengubah status program.
- **AC-05:** 3 DONE, 1 TODO, dan 1 CANCELLED menghasilkan 75%; pembukaan kembali satu task DONE menjadi TODO menghasilkan 50%; client dengan program berukuran berbeda memakai hitungan task gabungan.

### FR-06 — Meeting dan konsultasi — P0

- Catatan memuat waktu, peserta internal/eksternal sebagai teks, ringkasan pembahasan, keputusan, dan tindak lanjut.
- Catatan dimulai sebagai `DRAFT`; `FINAL` wajib memiliki ringkasan dan keputusan, termasuk “tidak ada keputusan” bila sesuai.
- Setiap tindak lanjut wajib menautkan task atau mencantumkan alasan tidak dijadikan task. Pembuatan task dari tindak lanjut tidak boleh menghasilkan duplikat saat klik diulang.
- Catatan FINAL dapat dikoreksi pembuatnya atau Lead/Admin dengan alasan dan audit; tidak ditimpa tanpa jejak.
- **AC-06:** catatan FINAL dengan tindak lanjut yang belum diputuskan ditolak; task hasil meeting memakai assignee dan deadline; tautan dua arah meeting–task bekerja.

### FR-07 — Dokumen client — P0

- Unggah dokumen pada program dengan kategori: Administrasi, Asesmen, Materi, Deliverable, dan Lainnya.
- Usulan batas MVP: 20 MB/file; PDF, DOCX, XLSX, PPTX, JPG, dan PNG. ZIP, executable, HTML, dan file macro-enabled tidak didukung.
- Sistem memeriksa ekstensi, MIME, signature yang relevan, serta ukuran di server. Dokumen diunduh sebagai attachment; thumbnail/preview bukan kebutuhan MVP.
- File tersimpan di storage privat. Unduhan memerlukan otorisasi; URL sementara jika digunakan memiliki masa berlaku singkat. Nama file asli tidak dipakai sebagai storage key.
- Penggantian dokumen membuat unggahan baru dan mengarsipkan versi sebelumnya; tidak menimpa file diam-diam. Bukti pembayaran memakai kontrol akses Finance/Admin.
- **AC-07:** file yang valid dapat diunggah/diunduh oleh pihak berhak; file tidak valid/terlalu besar ditolak; URL tebakan dan akses lintas program gagal; kegagalan storage tidak meninggalkan dokumen yang tampak berhasil.

### FR-08 — Invoice — P0

- Invoice memuat identitas Shaff Development, snapshot nama/alamat client, program, item jasa, tanggal, jatuh tempo, rekening, dan catatan opsional.
- Mata uang MVP adalah IDR. Harga satuan dan pembayaran menggunakan rupiah bulat; kuantitas bilangan bulat positif. Nilai uang tidak dihitung dengan floating-point.
- Total = jumlah kuantitas × harga satuan untuk seluruh item. Total terbit harus positif. Diskon, pajak, dan biaya tambahan terstruktur di luar MVP; kebutuhan tersebut harus diputuskan sebelum pemakaian nyata jika dibutuhkan usaha.
- Tanggal jatuh tempo tidak boleh lebih awal daripada tanggal terbit. Tanggal pembayaran tidak boleh di masa depan atau lebih awal daripada tanggal terbit invoice; kebutuhan pencatatan uang muka sebelum penerbitan memerlukan perubahan scope.
- Status dokumen: `DRAFT`, `ISSUED`, `CANCELLED`. Nomor diberikan hanya saat penerbitan, memakai urutan unik tahunan, misalnya `SD/2026/0001`; nomor tidak digunakan ulang dan tidak harus tanpa celah.
- Draft dapat diedit/dihapus oleh Finance/Admin. Invoice terbit tidak dapat diedit atau dihapus. Koreksi dilakukan dengan membatalkan lalu membuat pengganti jika semua pembayaran telah di-void dan alasan koreksi dicatat.
- Tampilan cetak mempertahankan snapshot saat terbit meskipun profil client/organisasi berubah.
- **AC-08:** dua proses penerbitan bersamaan menghasilkan nomor berbeda; pengulangan request tidak menerbitkan invoice ganda; cetak cocok dengan snapshot; perubahan invoice terbit ditolak.

### FR-09 — Pembayaran manual — P0

- Finance/Admin mencatat tanggal, nominal positif, metode (`TRANSFER`, `CASH`, `OTHER`), referensi opsional, dan bukti opsional.
- Pembayaran hanya untuk invoice `ISSUED`. Nominal tidak boleh melebihi saldo, termasuk pada request bersamaan. Mata uang mengikuti invoice.
- Saldo = total invoice − jumlah pembayaran yang tidak di-void.
- Status pembayaran dihitung: `UNPAID` jika belum ada pembayaran valid, `PARTIAL` jika saldo di antara nol dan total, `PAID` jika saldo nol.
- `OVERDUE` adalah penanda tambahan ketika tanggal jatuh tempo sudah lewat dan saldo positif; tidak menghilangkan status PARTIAL.
- Kesalahan pencatatan dibetulkan dengan void beralasan oleh Finance/Admin lalu input pembayaran yang benar. Tidak ada penghapusan permanen atau pengeditan nominal pembayaran. Void adalah koreksi pencatatan, bukan pengembalian uang ke client.
- **AC-09:** invoice Rp1.000.000 dengan pembayaran Rp400.000 bersaldo Rp600.000 dan PARTIAL; pembayaran berikutnya Rp600.000 menjadi PAID; void Rp400.000 mengembalikan saldo Rp400.000; pembayaran berlebih dan duplikat request ditolak/dideduplikasi.

### FR-10 — Dashboard dan pencarian — P0

- Admin: client aktif, program ACTIVE/ON_HOLD, task overdue/blocked, due minggu ini, serta piutang.
- Lead: metrik operasional dalam lingkup, progress per client, dan ringkasan tagihan yang dapat diakses.
- Anggota: task sendiri hari ini, tujuh hari ke depan, overdue, dan blocked.
- Finance: invoice belum lunas, total piutang, invoice overdue, dan penerimaan tercatat pada rentang tanggal terpilih.
- Total piutang menjumlah saldo invoice ISSUED, termasuk yang programnya sudah selesai. Invoice DRAFT/CANCELLED tidak dihitung. Penerimaan mengecualikan pembayaran void dan menggunakan tanggal pembayaran.
- Kartu metrik membuka daftar yang memakai filter serta lingkup sama. Pencarian MVP per modul, bukan mesin pencarian global.
- **AC-10:** nilai kartu sama dengan daftar rinci; perubahan task/payment tercermin setelah pembaruan; pengguna tidak melihat jumlah atau cuplikan data di luar izin.

### FR-11 — Audit, arsip, dan administrasi — P0

- Catat perubahan role/status akun, assignment, status program/task, deadline, finalisasi meeting, arsip dokumen, serta penerbitan/pembatalan invoice dan pencatatan/void pembayaran.
- Log memuat aktor, waktu, objek, dan perubahan sebelum/sesudah yang relevan; hindari menyalin isi sensitif dokumen atau token.
- Data historis memakai arsip/penonaktifan; draft invoice adalah pengecualian penghapusan yang eksplisit.
- UI tidak menyediakan edit/hapus AuditLog. Pengarsipan client ditolak bila masih ada program PLANNED/ACTIVE/ON_HOLD atau invoice ISSUED dengan saldo positif.
- **AC-11:** perubahan penting memiliki audit yang benar; percobaan edit audit oleh pengguna aplikasi gagal; client dengan kewajiban terbuka tidak dapat diarsipkan.

## 9. Aturan status, waktu, dan konsistensi

| Objek | Transisi dan batasan |
|---|---|
| Client | PROSPECT → ACTIVE; ACTIVE ↔ INACTIVE; PROSPECT/ACTIVE/INACTIVE → ARCHIVED dengan syarat arsip. INACTIVE hanya bila tidak ada program ACTIVE/ON_HOLD. Admin dapat memulihkan arsip ke INACTIVE dengan audit. Program ACTIVE hanya boleh pada client ACTIVE. |
| Program | PLANNED → ACTIVE/CANCELLED; ACTIVE ↔ ON_HOLD; ACTIVE/ON_HOLD → COMPLETED/CANCELLED. COMPLETED mensyaratkan tidak ada task TODO/IN_PROGRESS/BLOCKED, ringkasan hasil, konfirmasi deliverable, dan minimal satu DONE. Jika tidak ada task terukur, Admin wajib memberi alasan penutupan khusus. |
| Pembatalan program | Lead/Admin wajib memberi alasan; task yang masih aktif dibatalkan secara atomik dan tetap memiliki riwayat. Invoice tidak otomatis dibatalkan. |
| Membuka program kembali | Hanya Lead/Admin, dengan alasan; COMPLETED → ACTIVE pada client ACTIVE. Program CANCELLED tidak dibuka kembali; buat program baru bila dibutuhkan. |
| Task | TODO/IN_PROGRESS/BLOCKED dapat berpindah atau menjadi DONE sesuai validasi. Lead/Admin dapat CANCELLED atau membuka DONE kembali ke TODO dengan alasan. Task CANCELLED dipertahankan sebagai riwayat; pekerjaan lanjutan memakai task baru. |
| Edit program terminal | Tidak boleh membuat/mengubah task atau meeting pada program COMPLETED/CANCELLED. Unggah dokumen penutupan hanya Lead/Admin; pencatatan keuangan tetap boleh sesuai status invoice. |
| Deadline | Task menggunakan tanggal kalender, bukan jam; task terbuka overdue bila deadline lebih awal dari tanggal hari ini di Asia/Jakarta. Hari jatuh tempo belum overdue. Task CANCELLED/DONE dikecualikan. |
| Tanggal task | Deadline di luar rentang program menampilkan peringatan dan harus dikonfirmasi Lead/Admin; anggota tidak dapat melewati batas sendiri. Task tetap dapat terlambat saat program ON_HOLD; deadline tidak bergeser otomatis. |
| Waktu | Timestamp kejadian disimpan UTC dan ditampilkan Asia/Jakarta. Tanggal tanpa waktu disimpan sebagai nilai tanggal agar tidak bergeser karena konversi zona waktu. |
| Integritas | Task, meeting, dokumen, dan invoice tidak dapat menautkan client yang berbeda dari programnya. Client program tidak dapat dipindahkan setelah ada data turunan. |
| Konkruensi | Penerbitan invoice dan pembayaran memakai transaksi serta deduplikasi request. Edit data yang telah berubah sejak dibuka menghasilkan konflik dan permintaan muat ulang, bukan kehilangan perubahan. |

## 10. Struktur layar dan pengalaman pengguna

Navigasi utama: **Dashboard, Pekerjaan Saya, Client, Program, Meeting, Dokumen, Keuangan, Pengaturan**. Menu yang tidak diizinkan disembunyikan; backend tetap melakukan pemeriksaan akses.

| Layar | Komponen utama |
|---|---|
| Login / aktivasi / reset | Form ringkas, validasi, status berhasil/gagal |
| Dashboard | Kartu metrik, daftar prioritas tindakan, filter waktu yang relevan |
| Pekerjaan Saya | Daftar/board, filter cepat, buka detail task |
| Daftar client | Pencarian, filter, pagination, tombol tambah sesuai izin |
| Detail client | Ringkasan, kontak, program, activity, ringkasan tagihan sesuai izin |
| Detail program | Tujuan/deliverable, tim, progress, task, meeting, dokumen, invoice |
| Detail task | Status, assignee, deadline, checklist, hasil, komentar, riwayat |
| Meeting | Daftar, form catatan, finalisasi, tindak lanjut terkait |
| Dokumen | Daftar berdasarkan client/program/kategori, unggah, unduh, arsip |
| Keuangan | Daftar/detail invoice, draft, cetak, pembayaran, void, filter piutang |
| Pengaturan | Profil organisasi, akun dan role, audit untuk Admin |

Prinsip UI:

- Bahasa utama Indonesia; label konsisten antara daftar, detail, dan filter.
- Prioritaskan nama client, pekerjaan berikutnya, assignee, deadline, dan kendala.
- Pada mobile, tabel menjadi kartu atau memakai tampilan yang tetap terbaca tanpa membuat seluruh halaman bergeser horizontal.
- Setiap layar memiliki loading, empty, error, forbidden, dan success state yang relevan.
- Status dibedakan dengan teks/ikon selain warna. Form memiliki label, pesan kesalahan dekat field, fokus keyboard jelas, dan target sentuh memadai.
- Konfirmasi digunakan untuk pembatalan, void, arsip, serta perubahan role; perubahan rutin tidak memerlukan dialog tambahan.
- Form mencegah submit ganda dan memperingatkan jika pengguna meninggalkan perubahan yang belum tersimpan.

## 11. Kebutuhan nonfungsional

### NFR-01 — Keamanan dan privasi

- Seluruh operasi privat memerlukan autentikasi dan otorisasi server. Uji IDOR pada ID objek dan file.
- Password di-hash menggunakan mekanisme yang didukung library autentikasi yang dipilih; jangan membangun algoritma kriptografi sendiri.
- Terapkan HTTPS, cookie sesi aman, pembatasan percobaan login, perlindungan request mutasi yang relevan, validasi server, serta pembatasan upload.
- Secrets hanya di konfigurasi environment yang aman; repository menyertakan contoh nama variabel tanpa nilai rahasia.
- Data client nyata tidak dipakai sebagai seed pengembangan atau screenshot publik. Backup dan storage privat mengikuti pembatasan akses.
- Kebijakan retensi dokumen, masa simpan backup, serta prosedur permintaan penghapusan ditetapkan pemilik produk sebelum produksi; MVP tidak menjalankan hard-delete otomatis.

### NFR-02 — Performa dan skala awal

- Asumsi pengujian: 25 akun internal, 20 pengguna bersamaan, 500 client, 1.500 program, 30.000 task, dan 5.000 invoice.
- Target p95 respons server untuk daftar/filter ≤1,5 detik dan dashboard ≤2 detik pada staging dengan dataset tersebut; upload/download dan cold start dilaporkan terpisah.
- Tetapkan profil jaringan uji sebelum UAT; target halaman utama siap digunakan ≤3 detik pada profil tersebut. Ukur dan simpan hasil, jangan menyimpulkan dari mesin pengembang saja.
- Daftar memakai pagination dan filter di server; indeks mengikuti query aktual. Penyimpanan file tidak menggunakan filesystem sementara deployment.

### NFR-03 — Keandalan dan pemulihan

- Lingkungan development, staging, dan production terpisah, termasuk database, file storage, dan secrets.
- Backup database dan file minimal harian; usulan retensi 30 hari, RPO ≤24 jam dan RTO ≤8 jam. Target serta biaya harus disahkan sebelum produksi.
- Uji restore database dan file ke lingkungan terpisah; backup dianggap siap hanya setelah bukti pemulihan berhasil.
- Migration ditinjau dan dicoba di staging. Perubahan berisiko memakai strategi kompatibilitas dan rencana pemulihan; mengembalikan aplikasi tidak otomatis mengembalikan schema/data.
- Tersedia health check, error logging dengan penyamaran data sensitif, pemantauan kegagalan backup, dan PIC penanganan insiden.

### NFR-04 — Kualitas dan kompatibilitas

- Type checking, lint, build, serta pengujian alur kritis menjadi syarat merge/release.
- Uji viewport 360, 768, dan 1440 px; browser Chrome, Edge, dan Safari pada perangkat yang disepakati tim.
- Tabel dan form dapat dipakai dengan keyboard; informasi inti tidak bergantung pada hover atau drag.
- Dependensi, versi runtime, autentikasi, hosting, dan storage dipilih pada desain teknis dan dicatat dalam keputusan arsitektur sebelum implementasi fondasi.

## 12. Arah arsitektur

- **Next.js:** antarmuka dan lapisan aplikasi/server dalam satu codebase untuk MVP.
- **PostgreSQL + Prisma:** penyimpanan relasional, constraints, migration, dan akses data. Integritas bisnis yang lintas operasi tetap dijaga di transaksi server.
- **Tailwind + shadcn/ui:** komponen konsisten dan responsive; tokens warna, spacing, typography, dan status ditetapkan sebelum membuat banyak layar.
- **Object storage privat:** dokumen program serta bukti pembayaran, dengan metadata dalam database.
- **Library autentikasi terpelihara:** pilihan final setelah evaluasi kebutuhan sesi, aktivasi, reset, dan role. Jangan memilih versi hanya dari ingatan; cek dokumentasi saat implementasi.
- Modul konseptual: auth, team, clients, programs, tasks, meetings, documents, billing, dashboard, audit. Modul boleh berada dalam satu aplikasi; tidak diperlukan microservices.
- Aturan akses dan perhitungan progress/keuangan diletakkan di layanan server yang dapat diuji, tidak diduplikasi sebagai sumber kebenaran di browser.
- Repository baru mandiri dengan dokumentasi setup, contoh environment, seed data fiktif, migration, CI, dan runbook.

## 13. Urutan rilis dan dependensi

| Tahap | Hasil | Dependensi |
|---|---|---|
| 0. Penetapan kebutuhan | PRD, batasan, role, asumsi dan PIC disahkan | Pemilik produk dan wakil pengguna |
| 1. Desain alur dan data | Wireframe, kontrak data, matriks izin, keputusan teknis | Tahap 0 |
| 2. Fondasi | Repo baru, environment, CI, schema awal, login dan role | Tahap 1 |
| 3. Operasional inti | Client, program, task, progress | Tahap 2 |
| 4. Dokumentasi layanan | Meeting, tindak lanjut, file privat | Tahap 3 |
| 5. Keuangan | Invoice, cetak, pembayaran dan koreksi | Client/program stabil |
| 6. Dashboard dan pengerasan | Metrik terverifikasi, uji integrasi, keamanan, performa | Tahap 3–5 |
| 7. UAT dan pilot | Persetujuan pengguna, panduan, pilot dengan data terkontrol | Tahap 6 |
| 8. Produksi | Deployment, restore teruji, monitoring dan evaluasi | Semua gate rilis lulus |

Durasi sprint dan tanggal produksi belum ditentukan. Estimasi dibuat setelah kapasitas developer, rancangan layar, hosting, dan keputusan tertunda diketahui.

## 14. Skenario UAT minimum

| ID | Skenario dan hasil yang harus terlihat |
|---|---|
| UAT-01 | Admin membuat akun; user aktivasi, login, logout; reset token sekali pakai; nonaktif atau sesi dicabut tidak lagi mengakses data. |
| UAT-02 | Admin membuat client dan Lead; Lead membuat program dan anggota; validasi kontak utama dan tanggal menolak input salah. |
| UAT-03 | Anggota menjalankan task dari TODO ke IN_PROGRESS, BLOCKED dengan alasan, lalu DONE dengan hasil; progress dan audit berubah tepat. |
| UAT-04 | DONE dibuka kembali oleh Lead; CANCELLED dikecualikan; program tanpa task menampilkan kondisi kosong; progress client memakai gabungan task. |
| UAT-05 | Meeting FINAL menghasilkan tindak lanjut tertaut tanpa task ganda; catatan yang belum lengkap tidak dapat difinalkan. |
| UAT-06 | File valid berhasil; file besar/jenis terlarang ditolak; akses langsung file dari akun di luar program dan sesi kedaluwarsa gagal. |
| UAT-07 | Invoice draft diterbitkan dan dicetak; profil client diubah; invoice lama tetap memakai snapshot; penerbitan bersamaan menghasilkan nomor unik. |
| UAT-08 | Pembayaran sebagian → lunas → koreksi void menghasilkan saldo benar; submit ulang dan dua pembayaran bersamaan tidak membuat saldo negatif. |
| UAT-09 | Invoice sebagian dibayar dan lewat jatuh tempo tetap PARTIAL serta OVERDUE; DRAFT/CANCELLED tidak menambah piutang. |
| UAT-10 | Anggota A tidak bisa membaca program B lewat URL/API/search/dashboard; anggota tidak bisa membaca invoice; Lead terbatas pada client yang ditugaskan. |
| UAT-11 | Program belum selesai tidak dapat ditutup; penonaktifan user dengan task aktif dan arsip client berkewajiban terbuka diblokir; penutupan tidak menghapus piutang. |
| UAT-12 | Alur utama client → program → task → meeting → invoice → pembayaran dapat dijalankan di mobile dan desktop; empty/error/konflik edit dapat dipahami. |
| UAT-13 | Restore database dan file ke lingkungan terpisah berhasil; record, file, saldo invoice, akses, dan waktu pemulihan diverifikasi. |

## 15. Risiko dan mitigasi

| Risiko | Mitigasi |
|---|---|
| Scope bertambah menjadi ERP atau CRM besar | Daftar di luar MVP dan change request dengan dampak estimasi |
| Progress tampak baik karena task kecil terlalu banyak | Bobot sederhana dinyatakan jelas; Lead memeriksa deliverable sebelum menyelesaikan program |
| Dokumen atau keuangan terbuka ke anggota yang salah | Otorisasi server, storage privat, uji akses negatif lintas role/objek |
| Pencatatan pembayaran ganda atau salah | Transaksi, idempotensi, pembatasan saldo, void beralasan dan audit |
| Tim tetap memakai catatan terpisah | Pilot, Pekerjaan Saya yang sederhana, panduan singkat, evaluasi mingguan |
| Data hilang saat deployment atau gangguan storage | Backup database/file, rehearsal migration, restore teruji |
| Kebutuhan invoice nyata lebih kompleks dari MVP | Validasi contoh invoice dan kebutuhan koreksi sebelum membangun billing |

## 16. Asumsi dan keputusan yang harus disahkan

Dokumen dapat dipakai untuk perencanaan sekarang. Item berikut wajib ditentukan sebelum tahap yang bergantung padanya dimulai; tidak dianggap sudah disetujui karena tertulis di sini.

| ID | Usulan awal / keputusan | Penanggung jawab | Batas keputusan |
|---|---|---|---|
| D-01 | Satu organisasi, empat role, pembatasan akses menurut matriks bagian 4 | Pemilik produk | Sebelum schema/auth dibangun |
| D-02 | Nama repo `shaff-development`, lokasi baru terpisah, pengelola repo dan metode review | Pemilik produk + Tech Lead | Sebelum membuat repository |
| D-03 | Task tanpa approval tambahan; Lead bisa membuka kembali hasil yang belum sesuai | Lead operasional | Sebelum modul task |
| D-04 | Progress bobot sama per task; ruang lingkup progress client ACTIVE/ON_HOLD | Lead operasional | Sebelum modul progress |
| D-05 | Identitas invoice, rekening, format nomor, IDR rupiah bulat, tanpa pajak/diskon terstruktur | Finance + pemilik produk | Sebelum modul billing; gunakan contoh invoice nyata yang disamarkan |
| D-06 | Hosting aplikasi/database/storage, domain, anggaran dan PIC infrastruktur | Pemilik produk + Tech Lead | Sebelum setup staging |
| D-07 | Batas file 20 MB dan daftar format; perkiraan kapasitas storage | Lead operasional + Tech Lead | Sebelum modul dokumen |
| D-08 | Retensi, backup 30 hari, target RPO/RTO, pemilik insiden | Pemilik produk + Tech Lead | Sebelum pilot memakai data nyata |
| D-09 | Jumlah pengguna/client awal, dataset pilot, target keberhasilan, tanggal rilis | Pemilik produk + Lead | Sebelum menyusun komitmen jadwal |
| D-10 | Aktivasi/reset lewat tautan yang disampaikan manual; PIC pemulihan akses Admin | Admin + Tech Lead | Sebelum auth dirilis |

## 17. Definition of Ready dan Definition of Done

**Ready untuk sebuah fitur:** FR/AC tertaut, scope dan contoh data jelas, desain layar tersedia, izin serta edge case ditentukan, dependensi siap, dan keputusan yang memblokir sudah dicatat.

**Done untuk sebuah fitur:** alur utama dan kondisi gagal bekerja, validasi/otorisasi server teruji, migration terkait tersedia, UI responsive, audit relevan tercatat, check CI lulus, reviewer memeriksa perubahan, dan bukti AC ditautkan pada checklist.

**MVP boleh dirilis:** seluruh FR P0 beserta NFR lulus, seluruh UAT kritis lulus, tidak ada bug yang menghalangi alur utama atau membuka data tanpa izin, backup/restore terbukti, pemilik operasional dan Finance memberi sign-off, serta panduan dan prosedur rollback tersedia. Bug minor hanya boleh ditunda dengan pemilik, tenggat, dan penerimaan risiko tercatat.
