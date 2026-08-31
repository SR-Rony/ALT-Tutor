#!/usr/bin/env bash
# ALT Tutor frontend production build for alttutor.org VPS
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Clean previous build"
rm -rf .next

echo "==> Install deps"
npm ci

echo "==> Production build (loads .env.production automatically)"
npm run build

echo
echo "==> Start on VPS"
echo "pm2 start npm --name alt-frontend -- start"
echo "Or: npm run start"
echo
echo "Media files are served from api.alttutor.org/media (VPS disk, not Cloudinary)"
