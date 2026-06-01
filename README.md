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

These folders are planned but should be created only when the relevant implementation phase starts.

## Setup

No application code has been implemented yet. These are the planned setup steps once implementation begins.

1. Install Node.js and pnpm.
2. Create a Discord application in the Discord Developer Portal.
3. Create a bot user and copy the bot token.
4. Configure OAuth2 and invite the bot to the target server with slash command permissions.
5. Create a Supabase project with PostgreSQL.
6. Enable pgvector when the vector search phase begins.
7. Copy `.env.example` to `.env`.
8. Fill in required environment variables.
9. Start the application using the documented command added during implementation.
10. Register the `/ask` slash command.
11. Load verified knowledge records.
12. Test known, unknown, invalid, and ambiguous questions.

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

