#!/bin/sh
set -eu

: "${DATABASE_URL:?DATABASE_URL wajib diisi}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
FILE_STORAGE_PATH="${FILE_STORAGE_PATH:-./data/private}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET="$BACKUP_DIR/$STAMP"
mkdir -p "$TARGET"

echo "Membuat backup database..."
pg_dump "$DATABASE_URL" --format=custom --file="$TARGET/database.dump"
if [ -d "$FILE_STORAGE_PATH" ]; then
  echo "Membuat backup file private..."
  tar -C "$FILE_STORAGE_PATH" -czf "$TARGET/files.tar.gz" .
else
  echo "Storage file tidak ditemukan; membuat marker kosong."
  : > "$TARGET/files.missing"
fi
printf '%s\n' "$STAMP" > "$TARGET/created-at.txt"
echo "Backup selesai: $TARGET"
