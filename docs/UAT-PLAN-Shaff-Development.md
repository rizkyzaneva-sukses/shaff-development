# UAT Plan — Shaff Development

Dokumen ini dipakai di staging setelah migration dan seed selesai. UAT harus dijalankan oleh pengguna bisnis, bukan dianggap lulus hanya karena build berhasil.

## Akun pilot

Password semua akun berasal dari `SEED_DEMO_PASSWORD` saat seed development/staging. Jangan menulis password pada dokumen atau ticket.

| Penguji | Email | Role aplikasi | Fokus |
| --- | --- | --- | --- |
| CEO | `ceo@shaff.dev` | ADMIN | lintas workspace, audit, keputusan |
| COO | `coo@shaff.dev` | ADMIN | koordinasi, assignment, workflow |
| CMO | `cmo@shaff.dev` | LEAD | client/program yang ditugaskan, meeting |
| CTO | `cto@shaff.dev` | MEMBER | task, dokumen, program yang diikuti |
| CFO | `cfo@shaff.dev` | FINANCE | approval invoice, payment, saldo |

## Skenario wajib

- [ ] Login/logout, activation/reset, dan user nonaktif tidak dapat memakai sesi lama.
- [ ] CEO/COO dapat membuat client, program, anggota, task, dan melihat audit log.
- [ ] CMO hanya melihat client yang menjadi lead dan program di bawahnya.
- [ ] CTO hanya melihat program yang diikuti; URL client/program lain mengembalikan 404/403; invoice tidak terlihat.
- [ ] CFO dapat membuat draft invoice, approve/reject, issue, mencatat pembayaran sebagian, dan melihat saldo.
- [ ] Invoice yang belum approved tidak dapat diterbitkan; idempotency tidak menggandakan invoice/payment.
- [ ] Meeting dapat dibuat sebagai draft, tampil pada kalender, dan finalisasi membutuhkan ringkasan serta keputusan.
- [ ] Dokumen upload/download/archive/review mengikuti scope program; file tebakan dan MIME palsu ditolak.
- [ ] Task BLOCKED membutuhkan alasan, DONE membutuhkan ringkasan, dan konflik versi tidak menimpa perubahan terbaru.
- [ ] Notifikasi menampilkan task overdue, meeting mendatang, invoice jatuh tempo, dan program risk.
- [ ] Template program dan recurring task menghasilkan task dengan assignee anggota aktif.
- [ ] Export CSV/Excel dan cetak PDF hanya berisi data dalam scope penguji.
- [ ] Import client/contact CSV menolak row invalid, lead invalid, dan file di atas batas.
- [ ] Backup dibuat, restore rehearsal berhasil di environment terpisah, lalu health/login/dashboard smoke test lulus.

## Bukti dan sign-off

Catat environment, commit, tanggal, penguji, hasil aktual, screenshot/request ID, dan bug pada checklist pengembangan. UAT dinyatakan lulus hanya jika semua skenario kritis selesai dan pemilik produk serta Finance menandatangani.

