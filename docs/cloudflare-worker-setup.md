# Cloudflare Worker Setup

This project can run the Discord `/ask` flow through a Cloudflare Worker. The
Worker exposes:

- `GET /health`
- `POST /discord`

The root path `/` returns `Not found`; that is expected.

## Login

Run from the repository root:

```sh
corepack pnpm --filter @campus-qa/worker exec wrangler login
```

Follow the browser authorization flow.

## Secrets

Set secrets with Wrangler. Do not paste real secret values into documentation,
Git, or chat logs.

```sh
corepack pnpm --filter @campus-qa/worker exec wrangler secret put DISCORD_APPLICATION_ID
corepack pnpm --filter @campus-qa/worker exec wrangler secret put DISCORD_PUBLIC_KEY
corepack pnpm --filter @campus-qa/worker exec wrangler secret put SUPABASE_URL
corepack pnpm --filter @campus-qa/worker exec wrangler secret put SUPABASE_SERVICE_ROLE_KEY
corepack pnpm --filter @campus-qa/worker exec wrangler secret put GEMINI_API_KEY
```

`AI_PROVIDER` and `GEMINI_MODEL` are configured in `apps/worker/wrangler.toml`.

## Deploy

```sh
corepack pnpm deploy:worker
```

Wrangler prints the Worker URL after deploy, for example:

```text
https://<worker-name>.<account>.workers.dev
```

## Test

Health check:

```sh
curl https://<worker-url>/health
```

Expected response:

```text
OK
```

The Discord interaction endpoint is:

```text
https://<worker-url>/discord
```

Paste that full `/discord` URL into the Discord Developer Portal as the
Interactions Endpoint URL.

## Logs

```sh
corepack pnpm --filter @campus-qa/worker exec wrangler tail
```

Logs must not include Discord tokens, Supabase service role keys, or AI API keys.
