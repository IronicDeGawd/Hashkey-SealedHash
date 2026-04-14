# SealedHash infra

EC2 host setup for the off-chain backend (Postgres + Next.js + indexer).

The Solidity contracts and the on-chain auction state have **no dependency**
on anything in here. This is the post-hackathon v2 backend only.

## Layout

```
infra/
  docker-compose.yml      # Postgres 16, bound to 127.0.0.1:5432
  scripts/
    pg-backup.sh          # nightly pg_dump → /var/backups/sealedhash
    install-timers.sh     # idempotent installer for every systemd unit
  systemd/
    sealedhash-backup.service
    sealedhash-backup.timer
    sealedhash-indexer.service   (added in Phase 6)
    sealedhash-indexer.timer     (added in Phase 6)
```

## One-time host setup

```bash
# 1. Clone repo to /opt/sealedhash
sudo git clone <repo-url> /opt/sealedhash
sudo chown -R deploy:deploy /opt/sealedhash

# 2. Secrets file at /etc/sealedhash/env (chmod 600, owned by deploy)
sudo install -d -m 700 -o deploy -g deploy /etc/sealedhash
sudo -u deploy tee /etc/sealedhash/env > /dev/null <<EOF
POSTGRES_PASSWORD=$(openssl rand -hex 32)
SESSION_PASSWORD=$(openssl rand -hex 32)
DATABASE_URL=postgres://sealedhash:\${POSTGRES_PASSWORD}@127.0.0.1:5432/sealedhash
INDEXER_RPC_URL=https://testnet.hsk.xyz
EOF
sudo chmod 600 /etc/sealedhash/env

# 3. Backup target on a separate EBS volume
sudo install -d -m 755 -o deploy -g deploy /var/backups/sealedhash

# 4. Bring up Postgres
cd /opt/sealedhash/infra
sudo -u deploy docker compose --env-file /etc/sealedhash/env up -d

# 5. Verify Postgres is localhost-only — ANY 0.0.0.0 here is a security bug
ss -tlnp | grep 5432

# 6. Run migrations against the new DB
cd /opt/sealedhash/frontend
sudo -u deploy npm ci
sudo -u deploy DATABASE_URL="$(grep ^DATABASE_URL /etc/sealedhash/env | cut -d= -f2-)" npm run db:migrate

# 7. Install + enable systemd timers
sudo /opt/sealedhash/infra/scripts/install-timers.sh

# 8. Start Next.js under PM2
cd /opt/sealedhash/frontend
sudo -u deploy npm run build
sudo -u deploy pm2 start npm --name sealedhash-web -- start
sudo -u deploy pm2 save
sudo pm2 startup systemd -u deploy --hp /home/deploy
```

## Restore drill

The backup script writes gzipped `pg_dump` output. To restore:

```bash
# WARNING: this wipes existing data. Test against a throwaway container first.
gunzip -c /var/backups/sealedhash/sealedhash-<timestamp>.sql.gz \
  | docker exec -i sealedhash-postgres psql -U sealedhash sealedhash
```

You should run a restore drill into a throwaway container at least once before
relying on these backups. A backup you've never restored is a wish, not a backup.

## Operational checks

```bash
# Timers status
systemctl list-timers | grep sealedhash

# Last backup run
journalctl -u sealedhash-backup.service -n 50

# Postgres still localhost-only
ss -tlnp | grep 5432   # MUST show 127.0.0.1, never 0.0.0.0
```
