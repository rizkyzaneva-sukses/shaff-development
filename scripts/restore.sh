#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL wajib diisi}"
: "${BACKUP_PATH:?BACKUP_PATH menunjuk folder backup}"
: "${CONFIRM_RESTORE:?Set CONFIRM_RESTORE=YES untuk restore destruktif}"
[ "$CONFIRM_RESTORE" = "YES" ] || { echo "Restore dibatalkan; CONFIRM_RESTORE harus YES" >&2; exit 1; }
FILE_STORAGE_PATH="${FILE_STORAGE_PATH:-./data/private}"

[ -f "$BACKUP_PATH/database.dump" ] || { echo "database.dump tidak ditemukan" >&2; exit 1; }
echo "Memulihkan database..."
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" "$BACKUP_PATH/database.dump"
if [ -f "$BACKUP_PATH/files.tar.gz" ]; then
  mkdir -p "$FILE_STORAGE_PATH"
  echo "Memulihkan file private..."
  tar -C "$FILE_STORAGE_PATH" -xzf "$BACKUP_PATH/files.tar.gz"
fi
echo "Restore selesai. Jalankan smoke test login, dokumen, invoice, dan dashboard."
