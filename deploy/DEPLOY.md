# SealedHash — EC2 deployment runbook

Target: `ubuntu@ec2-13-127-147-110.ap-south-1.compute.amazonaws.com`
Public URL: `https://sealedhash.ironyaditya.xyz`
Docker stack: Postgres 16 + Next.js 16 frontend + on-chain indexer, all behind the host Caddy.

## One-time setup (fresh box)

### 1. Clone the repo

```bash
cd ~
git clone https://github.com/IronicDeGawd/Hashkey-SealedHash.git sealedhash
cd sealedhash
```

### 2. Generate secrets and write `deploy/.env`

```bash
cd deploy
cp .env.example .env
POSTGRES_PASSWORD=$(openssl rand -hex 24)
SESSION_PASSWORD=$(openssl rand -hex 32)
sed -i "s|replace-with-openssl-rand-hex-24|$POSTGRES_PASSWORD|" .env
sed -i "s|replace-with-openssl-rand-hex-32|$SESSION_PASSWORD|" .env
chmod 600 .env
unset POSTGRES_PASSWORD SESSION_PASSWORD
```

### 3. Build images and run migrations

```bash
# Build all three images
docker compose --profile migrate build

# Bring up Postgres first
docker compose up -d postgres

# Wait for healthy
until docker compose ps postgres | grep -q healthy; do sleep 1; done

# Run migrations one-shot
docker compose --profile migrate run --rm migrate
```

### 4. Start frontend + indexer

```bash
docker compose up -d frontend indexer
docker compose ps
docker compose logs --tail=50 frontend
docker compose logs --tail=50 indexer
```

### 5. Wire Caddy

```bash
# Append the site block
sudo tee -a /etc/caddy/Caddyfile < caddy-sealedhash.snippet

# Validate before reload
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

# Reload
sudo systemctl reload caddy
sudo systemctl status caddy --no-pager
```

### 6. Smoke test

```bash
# Host-local — confirms the container is serving
curl -sI http://127.0.0.1:3003 | head -5

# Public — through Cloudflare + Caddy
curl -sI https://sealedhash.ironyaditya.xyz | head -10

# Indexer liveness — watch for 2-3 ticks
docker compose logs -f --tail=20 indexer
```

## Day-two operations

### Redeploy from latest main

```bash
cd ~/sealedhash
git pull
cd deploy
docker compose build frontend indexer
docker compose up -d frontend indexer

# If the pull includes a new migration
docker compose --profile migrate run --rm migrate
```

### Inspect state

```bash
docker compose ps
docker compose logs --tail=100 frontend
docker compose logs --tail=100 indexer
docker compose exec postgres psql -U sealedhash -c "\dt"
docker compose exec postgres psql -U sealedhash -c "select * from indexer_state;"
docker compose exec postgres psql -U sealedhash -c "select count(*) from auction_history;"
```

### Rollback

```bash
cd ~/sealedhash
git log --oneline -5
git checkout <previous-commit>
cd deploy
docker compose build frontend indexer
docker compose up -d frontend indexer
```

### Stop the whole stack

```bash
cd ~/sealedhash/deploy
docker compose down            # keeps the postgres volume
docker compose down -v         # wipes postgres volume — only if you want a fresh DB
```

### Remove the Caddy block

```bash
sudo vi /etc/caddy/Caddyfile
# delete the sealedhash.ironyaditya.xyz { ... } stanza
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
```

## Hard constraints — do not change without explicit approval

- `NEXT_PUBLIC_TEST_PRIVATE_KEY` is NEVER set on this box. The test signer bridge is compile-time stripped in production builds, but setting the env var at runtime is still banned.
- Ports 3003 (frontend) and 5433 (postgres) are bound to `127.0.0.1` only, never `0.0.0.0`. Public traffic must go through Caddy.
- `deploy/.env` is `chmod 600`, never committed, never printed to logs.
- COOP `same-origin` and COEP `require-corp` headers must be present on every response or `@aztec/bb.js` will silently fail. Duplicated in `next.config.ts` AND `Caddyfile` as defence-in-depth.
- Indexer reads public chain data only. It must never import from `frontend/lib/crypto/*`.

## Troubleshooting

**Frontend 502 from Caddy**: container is down or unhealthy. `docker compose logs frontend` and `docker compose ps`.

**Indexer in a restart loop**: look for `DATABASE_URL` undefined or an RPC outage. `docker compose logs indexer`.

**Postgres connection refused from frontend**: the `postgres` service name only resolves inside the compose network. If frontend can't reach it, the services aren't sharing a network (check they're in the same compose project).

**Build fails with "next: not found"**: the `deps` stage of `Dockerfile.frontend` ran with `--omit=dev` somewhere. Rebuild with `docker compose build --no-cache frontend`.

**WASM silently hangs at the `/dev` proof button**: COOP/COEP not reaching the browser. Check the response headers via `curl -sI https://sealedhash.ironyaditya.xyz/dev | grep -i cross-origin` — both must appear.
