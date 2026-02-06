#!/usr/bin/env bash
# deploy.sh — RADStrat deployment script
# Usage: bash deploy.sh
set -euo pipefail

APP_DIR="/home/ubuntu/radstrat"
LOG_FILE="/var/log/radstrat-deploy.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }
error_exit() { log "ERROR: $1"; exit 1; }

# Safety check: warn if migrate dev found in any script
if grep -rq "migrate dev" "$APP_DIR/deploy.sh" 2>/dev/null; then
  log "WARNING: 'migrate dev' found in deploy script — this should NEVER run in production"
fi

log "=== Deployment started ==="

# 1. Navigate to app directory
cd "$APP_DIR" || error_exit "Cannot cd to $APP_DIR"
log "Working directory: $(pwd)"

# 2. Pull latest code
log "Pulling latest code..."
git pull origin main || error_exit "git pull failed"

# 3. Install dependencies (frozen lockfile — fails if out of date)
log "Installing dependencies..."
pnpm install --frozen-lockfile || error_exit "pnpm install failed"

# 4. Generate Prisma client
log "Generating Prisma client..."
cd packages/database
pnpm run db:generate || error_exit "Prisma generate failed"
cd "$APP_DIR"

# 5. Run database migrations (NEVER use migrate dev in production)
log "Running database migrations..."
cd packages/database
pnpm run db:deploy || error_exit "Prisma migrate deploy failed"
cd "$APP_DIR"

# 6. Build API
log "Building API..."
pnpm run build --filter=@repo/api || error_exit "API build failed"

# 7. Reload PM2
log "Reloading PM2..."
pm2 reload ecosystem.config.cjs --env production || error_exit "PM2 reload failed"

# 8. Save PM2 process list
pm2 save || error_exit "PM2 save failed"

# 9. Health check
log "Running health check..."
sleep 3
HEALTH=$(curl -sf http://localhost:3001/health 2>/dev/null) || error_exit "Health check failed — API not responding"
log "Health check response: $HEALTH"

log "=== Deployment completed successfully ==="
