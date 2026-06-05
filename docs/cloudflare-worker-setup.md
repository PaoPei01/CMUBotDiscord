# Cloudflare Worker Setup

This project runs the production Discord `/ask` flow through `apps/worker`.
The Cloudflare Worker is the primary production runtime for slash-command Q&A.

The Worker exposes:

- `GET /health`
- `POST /discord`

The root path `/` returns `Not found`; that is expected.

Discord's Interaction Webhook must point to:

```text
https://<worker-url>/discord
```

Do not use the optional Gateway bot as the primary production `/ask` runtime.

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

Required Worker secrets:

- `DISCORD_APPLICATION_ID`
- `DISCORD_PUBLIC_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional Worker secrets:

- `GEMINI_API_KEY`, only when Worker AI answer composition is enabled

Local `.env` values used while deploying/registering commands:

- `DISCORD_BOT_TOKEN` or `DISCORD_TOKEN`
- `DISCORD_APPLICATION_ID` or `DISCORD_CLIENT_ID`
- `DISCORD_GUILD_ID`
- `DISCORD_INTERACTIONS_ENDPOINT_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

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

## Register `/ask`

Register the Worker interaction command from the repository root:

```sh
set -a
source .env
set +a
corepack pnpm deploy:worker-commands
```

This registers `/ask` for the Discord Interaction Webhook flow. Keep the legacy
`deploy:commands` script only for the optional Gateway bot compatibility path;
it is not the preferred production `/ask` path.

## Logs

```sh
corepack pnpm --filter @campus-qa/worker exec wrangler tail
```

Logs must not include Discord tokens, Supabase service role keys, or AI API keys.

## Optional Gateway Bot

`apps/bot` is optional in production. Run it only when natural Q&A via
`messageCreate` is needed.

To disable natural Q&A:

```text
NATURAL_QA_ENABLED=false
```

or leave:

```text
CAMPUS_QA_CHANNEL_IDS=
```

If the optional Gateway bot is running, restart it after changing these values.

## What To Restart Or Redeploy

- Worker code, Worker secrets, Worker search, feedback, or `/ask` response changes:
  run `corepack pnpm deploy:worker`.
- Slash command schema changes:
  run `corepack pnpm deploy:worker-commands`.
- Supabase migrations:
  run the migration before deploying code that depends on it.
- Optional natural Q&A changes:
  restart/redeploy `apps/bot`.
- Admin dashboard changes:
  redeploy the admin host, such as Vercel.
