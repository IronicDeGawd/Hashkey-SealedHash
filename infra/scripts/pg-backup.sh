#!/usr/bin/env bash
# Nightly Postgres backup for SealedHash.
# Triggered by sealedhash-backup.timer on the EC2 host. Mount /var/backups/sealedhash
# on a separate EBS volume from the Docker data volume — if the data EBS dies,
# backups survive.
set -euo pipefail

DEST=/var/backups/sealedhash
CONTAINER=sealedhash-postgres

mkdir -p "$DEST"
TS=$(date +%Y%m%d-%H%M%S)
OUT="$DEST/sealedhash-$TS.sql.gz"

docker exec "$CONTAINER" pg_dump -U sealedhash sealedhash | gzip > "$OUT"

# Retain 14 days. Run after the new dump lands so a failure here doesn't
# orphan us with no recent backup.
find "$DEST" -name 'sealedhash-*.sql.gz' -mtime +14 -delete

echo "wrote $OUT"
