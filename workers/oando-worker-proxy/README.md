# oando-worker-proxy

Cloudflare Worker that serves as a reverse proxy for oando.co.in assets.

## Behavior

1. **Image requests** (`/images/*`): Try R2 bucket first, fall back to Vercel
2. **All other requests**: Proxy to Vercel origin

## Setup

```bash
# Install dependencies
pnpm install

# Deploy to Cloudflare
pnpm deploy

# Local development
pnpm dev
```

## Configuration

- **R2 Bucket**: `oando-asset-cdn` (bound as `ASSET_BUCKET`)
- **Vercel Origin**: `https://oandoweb.vercel.app` (configurable via `VERCEL_ORIGIN` env var)

## Environment Variables

Set in Cloudflare Dashboard or wrangler.toml:
- `VERCEL_ORIGIN`: Vercel deployment URL (default: `https://oandoweb.vercel.app`)
