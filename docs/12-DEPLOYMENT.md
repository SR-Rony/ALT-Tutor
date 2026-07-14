# 12 — Deployment

## Vercel (recommended for Next.js)

1. Connect Git repository
2. Set environment variables (match `.env.example`)
3. Build command: `npm run build`
4. Output: Next.js default

### Env vars (production)

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
NEXT_PUBLIC_USE_MOCK_API=false
```

---

## Docker (optional)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Enable `output: "standalone"` in `next.config.ts` for smaller images.

---

## CI/CD pipeline

`.github/workflows/ci.yml` included in template:

| Step | Command |
|------|---------|
| Install | `npm ci` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Build | `npm run build` |

Add `test` step when Vitest is configured.

---

## Pre-deploy checklist

- [ ] `NEXT_PUBLIC_USE_MOCK_API=false`
- [ ] API CORS configured for production domain
- [ ] Auth cookies: `Secure`, `SameSite`, correct domain
- [ ] Image domains in `next.config.ts`
- [ ] Error monitoring (Sentry) optional
- [ ] Analytics (optional)

---

## Performance

- Enable Next.js image optimization
- Use `loading.tsx` for route segments
- Lazy-load heavy charts/editors
- Review bundle with `@next/bundle-analyzer`

---

## Security headers

Add in `next.config.ts`:

```ts
async headers() {
  return [{
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
    ],
  }];
}
```
