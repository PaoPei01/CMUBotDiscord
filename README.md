# Campus Discord Q&A Bot

A verified Discord Q&A bot for university students.

The bot answers student questions from verified university knowledge only. It is intentionally not a general AI chatbot and not a Discord community management bot.

## Product Goal

Build a Discord bot that lets students ask questions with `/ask` and receive correct, cited answers from verified knowledge-base content.

Priority order:

1. Correctness
2. Source citation
3. Speed
4. Low cost
5. AI features

Never prioritize AI-generated answers over verified knowledge-base answers.

## Not This Project

Do not build:

- General AI chatbot behavior
- AI answers without database context
- Moderation tools
- Dynamic voice channels
- Voice channel features
- Leveling or XP systems
- LFG or game matching systems
- Activity tracking
- Calendar features
- Announcement systems
- Automatic production import from AI

## Core User Flow

User asks:

```text
/ask question: ค่าเทอมวิศวะเท่าไร
```

Bot should:

1. Search verified knowledge.
2. Return an answer.
3. Show the source.
4. Log the question.
5. Provide feedback buttons.

If no verified answer exists, return:

```text
ยังไม่พบข้อมูลที่ยืนยันได้จากฐานข้อมูลของระบบ
```

## Retrieval Architecture

The long-term retrieval flow is:

1. Exact FAQ match
2. Alias match
3. Keyword match
4. Full-text search
5. Vector search
6. AI answer composer

AI must never answer without retrieved verified context. If retrieved context is insufficient, the bot must not guess.

## Tech Stack

- TypeScript
- Node.js
- pnpm
- Discord.js v14
- Next.js
- Supabase
- PostgreSQL
- pgvector

## Planned Repository Structure

```text
apps/
  bot/
  admin/

packages/
  database/
  shared/
  knowledge/
  ai/
```

The Phase 1 foundation has created this structure with placeholders only.

## Setup

Install dependencies:

```sh
pnpm install
```

If `pnpm` is managed through Corepack, use:

```sh
corepack pnpm install
```

Copy environment placeholders:

```sh
cp .env.example .env
```

Do not commit `.env`.

Future setup steps:

1. Create a Discord application in the Discord Developer Portal.
2. Create a bot user and copy the bot token.
3. Configure OAuth2 and invite the bot to the target server with slash command permissions.
4. Create a Supabase project with PostgreSQL.
5. Enable pgvector when the vector search phase begins.
6. Register Discord slash commands in the Discord Bot MVP phase.
7. Load verified knowledge records after database schema exists.

## Run

Start the bot foundation health process:

```sh
pnpm dev:bot
```

Start the admin app:

```sh
pnpm dev:admin
```

Admin login:

- Set `ADMIN_PASSWORD` in `.env`.
- Open `/login`.
- Enter the configured password.

Register guild slash commands:

```sh
pnpm deploy:commands
```

The command registration script deploys to the single guild configured by `DISCORD_GUILD_ID`. It does not deploy global commands.

The bot logs in to Discord and listens only for interactions. It does not read normal chat messages.

The admin app provides FAQ management, question logs, and missing-answer review. Supabase service-role access is used only from server-side code.

## Environment Variables

See `.env.example` for required configuration placeholders.

Secrets must be stored in `.env` or the deployment platform secret store. Do not commit `.env` files or API keys.

Service role keys must only be used server-side.

## Data Requirements

Knowledge records should include:

- Question or topic
- Verified answer
- Aliases
- Keywords
- Source title
- Source URL or reference
- Verification status
- Last reviewed date

Only verified records should be available for production answers.

## Quality Requirements

Every feature must include:

- Type safety
- Error handling
- Logging
- Input validation

Before completing any implementation task, run:

```sh
pnpm lint
pnpm typecheck
pnpm build
```

Fix all errors before finishing.

## Phase 1 Dependency Notes

- `typescript`, `@types/node`, and `tsx` support strict TypeScript builds and local bot development.
- `eslint`, `@eslint/js`, and `typescript-eslint` provide linting for TypeScript source.
- `prettier` provides shared formatting configuration.
- `zod` powers shared environment validation.
- `pino` provides structured logging.
- `next`, `react`, and `react-dom` are required for the minimal admin app.
- `discord.js` is required for the Phase 3 slash command bot.
- `@supabase/supabase-js` is required for server-side bot and admin database reads/writes.

## Development Rules

Read `AGENTS.md` before implementing code.

Key rules:

- Build only Q&A features.
- Implement one phase at a time.
- Do not start the next phase unless explicitly instructed.
- Validate input and configuration.
- Require citations for all answers.
- Log questions and feedback.
- Add packages only for clear, explained reasons.
- Do not hardcode API keys.
- Do not commit `.env` files.
- Do not add AI until retrieval from verified context exists.
- Update `IMPLEMENTATION_PLAN.md` at the end of each phase.

## Implementation Plan

See `IMPLEMENTATION_PLAN.md` for phased delivery.
