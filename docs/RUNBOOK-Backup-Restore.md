# Runbook backup dan restore Shaff Development

Runbook ini dipakai untuk database PostgreSQL dan file private client. Backup bukan bukti pemulihan sampai restore berhasil diuji di environment terpisah.

## Backup terjadwal

Di EasyPanel, pasang private volume ke `FILE_STORAGE_PATH` (default `/app/data/private`) dan jalankan job terjadwal dari worker/cron yang memiliki `DATABASE_URL` serta akses volume:

```sh
BACKUP_DIR=/backups FILE_STORAGE_PATH=/app/data/private ./scripts/backup.sh
```

Simpan hasil backup di storage berbeda dari volume aplikasi. Retensi awal yang disarankan: harian 14 hari, mingguan 8 minggu, bulanan 12 bulan. Nilai retensi harus disahkan pemilik data.

## Restore rehearsal

Restore hanya ke database dan volume terpisah. Jangan menjalankan pada production tanpa change window dan persetujuan pemilik data.

```sh
DATABASE_URL="postgresql://.../shaff_restore?schema=public" \
FILE_STORAGE_PATH=/restore/private \
BACKUP_PATH=/backups/20260911T000000Z \
CONFIRM_RESTORE=YES \
./scripts/restore.sh
```

Sesudah restore:

1. Jalankan `prisma migrate deploy` bila backup berasal dari schema yang lebih lama.
2. Cek jumlah user, client, program, task, dokumen, invoice, dan payment.
3. Buka satu file hasil restore melalui route download privat.
4. Cocokkan saldo invoice dan pembayaran valid dengan catatan backup.
5. Jalankan smoke test `/api/health`, login, dashboard, dan satu alur mutasi.
6. Catat waktu mulai/selesai untuk menghitung RTO dan data terakhir untuk menghitung RPO.

## Kontrol keamanan

- Jangan menaruh `DATABASE_URL`, password, atau backup client di repository.
- Batasi akses folder backup hanya ke operator yang ditunjuk.
- Enkripsi backup saat transit dan saat disimpan bila provider belum melakukannya.
- Uji restore minimal sekali per kuartal dan setelah perubahan schema besar.
