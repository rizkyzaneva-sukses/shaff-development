#!/bin/bash
# Backup harian shaff-app — database + file privat.
# Dipasang di /usr/local/bin/shaff-backup, dijalankan cron jam 02:00.
#
# Simpan: /var/backups/shaff/<tanggal>/
#   database.dump   — pg_dump format custom (restore: pg_restore)
#   files.tar.gz    — isi FILE_STORAGE_PATH (dokumen privat)
#   created-at.txt  — penanda waktu
#
# Retensi: 14 hari terakhir. Retensi sengaja pendek karena disk dipakai bersama
# tenant lain di server ini — jangan naikkan tanpa cek `df -h` dulu.
set -uo pipefail

DEST=/var/backups/shaff
KEEP_DAYS=14
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
TARGET="$DEST/$STAMP"
LOG=/var/log/shaff-backup.log

log() { echo "[$(date '+%F %T')] $*" >> "$LOG"; }

DB_CONTAINER=$(sudo docker ps --format '{{.Names}}' | grep -m1 'shaff-db\.')
APP_CONTAINER=$(sudo docker ps --format '{{.Names}}' | grep -m1 'shaff-app\.')

if [ -z "$DB_CONTAINER" ]; then
  log "GAGAL: container shaff-db tidak ditemukan"
  exit 1
fi

mkdir -p "$TARGET"

# 1. Database
if sudo docker exec "$DB_CONTAINER" pg_dump -U postgres -d shaff_development \
     --format=custom -f /tmp/backup.dump 2>>"$LOG"; then
  sudo docker cp "$DB_CONTAINER:/tmp/backup.dump" "$TARGET/database.dump" >>"$LOG" 2>&1
  sudo docker exec "$DB_CONTAINER" rm -f /tmp/backup.dump
  DB_SIZE=$(sudo stat -c%s "$TARGET/database.dump" 2>/dev/null || echo 0)
  log "database: ${DB_SIZE} byte"
else
  log "GAGAL: pg_dump error"
  exit 1
fi

# 2. File privat (dokumen upload)
if [ -n "$APP_CONTAINER" ]; then
  if sudo docker exec "$APP_CONTAINER" test -d /app/data/private 2>/dev/null; then
    sudo docker exec "$APP_CONTAINER" tar -czf /tmp/files.tar.gz -C /app/data/private . 2>>"$LOG"
    sudo docker cp "$APP_CONTAINER:/tmp/files.tar.gz" "$TARGET/files.tar.gz" >>"$LOG" 2>&1
    sudo docker exec "$APP_CONTAINER" rm -f /tmp/files.tar.gz
    FILE_SIZE=$(sudo stat -c%s "$TARGET/files.tar.gz" 2>/dev/null || echo 0)
    log "files: ${FILE_SIZE} byte"
  else
    : > "$TARGET/files.missing"
    log "files: tidak ada direktori /app/data/private"
  fi
else
  : > "$TARGET/files.missing"
  log "files: container shaff-app tidak ditemukan"
fi

printf '%s\n' "$STAMP" > "$TARGET/created-at.txt"

# 3. Retensi
DELETED=$(sudo find "$DEST" -maxdepth 1 -type d -mtime +$KEEP_DAYS -print -exec rm -rf {} + 2>/dev/null | wc -l)
log "selesai: $TARGET (retensi buang $DELETED folder lama)"

# 4. Peringatan kalau backup gagal berulang (penanda sederhana)
if [ "$DB_SIZE" -lt 1000 ] 2>/dev/null; then
  log "PERINGATAN: ukuran dump tidak wajar (${DB_SIZE} byte)"
fi
