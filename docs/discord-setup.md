# Discord Setup

Use Discord's Interaction Webhook flow for the Cloudflare Worker. Do not run a
long-lived Gateway bot for the Worker flow.

## Application Values

Open the Discord Developer Portal, select the application, and copy:

- Application ID from `General Information`
- Public Key from `General Information`

Create or reset a bot token in `Bot`. Store it only in `.env` or a secret store.
Do not commit or paste the token into documentation.

## Server ID

In Discord:

1. Open `User Settings`.
2. Open `Advanced`.
3. Enable `Developer Mode`.
4. Right-click the target server.
5. Choose `Copy Server ID`.

Use that value as `DISCORD_GUILD_ID`.

## Worker Endpoint

After deploying the Worker, set the Discord Interactions Endpoint URL to:

```text
https://<worker-url>/discord
```

Discord will send a verification request. Saving succeeds only when the Worker
can verify signatures with `DISCORD_PUBLIC_KEY`.

## Register `/ask`

From the repository root, load local environment variables and register the
Worker-only command:

```sh
set -a
source .env
set +a
corepack pnpm deploy:worker-commands
```

Required local env values:

- `DISCORD_BOT_TOKEN` or `DISCORD_TOKEN`
- `DISCORD_APPLICATION_ID` or `DISCORD_CLIENT_ID`
- `DISCORD_GUILD_ID`

The command registered is:

```text
/ask question:<text>
```

## Invite The App

Use OAuth2 URL generation in the Discord Developer Portal. Select:

- `applications.commands`
- `bot` if the app still needs to be present in the server

Minimum practical permissions for slash-command responses:

- Use Application Commands
- Send Messages
- Embed Links

The Worker response uses the interaction webhook token, so it does not read
normal Discord messages.

## Test

In the target server, run:

```text
/ask
```

Ask a question that exists in active Supabase FAQ data, such as:

```text
ค่าเทอมต้องจ่ายวันไหน
```
