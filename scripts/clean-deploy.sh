#!/usr/bin/env bash
# Clean production deploy helper for ALT Tutor frontend (VPS + Cloudflare).
# Usage (from ALT-Tutor-frontend): ./scripts/clean-deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Clean previous build"
rm -rf .next

echo "==> Install deps (if needed)"
npm ci

echo "==> Production build"
npm run build

echo
echo "==> Deploy checklist"
echo "1. Upload/rsync THIS entire project (or at least: .next/, public/, package.json, package-lock.json, next.config.*, .env.production)"
echo "2. On server: npm ci --omit=dev && npm run start   (or pm2 restart)"
echo "3. Confirm BOTH exist on server:"
echo "     .next/static/chunks/app/layout-*.js"
echo "     .next/static/css/*.css"
echo "4. Cloudflare → Caching → Configuration → Purge Everything"
echo "5. Hard refresh browser (Ctrl+Shift+R) or open an Incognito window"
echo
echo "Do NOT upload only some of .next/static — partial copies cause ChunkLoadError 400."
echo "Build ID: $(cat .next/BUILD_ID 2>/dev/null || echo unknown)"
