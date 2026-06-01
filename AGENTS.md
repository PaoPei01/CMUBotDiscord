# Campus Discord Q&A Bot - Project Rules

## Mission

Build a verified Discord Q&A bot for university students. The bot answers student questions only from approved, cited university knowledge.

This project is not:

- a general AI chatbot
- a moderation bot
- a voice channel bot
- a leveling bot
- a gaming or community bot

The bot must answer from verified knowledge only.

## Priority Order

When tradeoffs are needed, choose in this order:

1. Correctness
2. Source citation
3. Speed
4. Low cost
5. AI features

Never prioritize AI-generated answers over verified knowledge-base answers.

## Core User Flow

User asks:

```text
/ask question: ค่าเทอมวิศวะเท่าไร
```

Bot should:

1. Search verified knowledge.
2. Return the answer.
3. Show the source.
4. Log the question.
5. Provide feedback buttons.

If no verified answer exists, return exactly:

```text
ยังไม่พบข้อมูลที่ยืนยันได้จากฐานข้อมูลของระบบ
```

## Product Scope

Only build Q&A features:

- Discord slash command `/ask`
- Verified FAQ or knowledge database
- Source citation on every answer
- Question logging
- Feedback buttons for answer quality
- Search engine later
- AI answer composer later, only when grounded in retrieved verified context

Do not build:

- General AI chat
- AI answers without verified database context
- Moderation
- Dynamic voice channels
- Voice channel features
- Leveling or XP
- LFG, game matching, or gaming/community systems
- Activity tracking
- Calendar features
- Announcement systems
- Automatic production import from AI

## Architecture Rules

The long-term retrieval flow is:

1. Exact FAQ match
2. Alias match
3. Keyword match
4. Full-text search
5. Vector search
6. AI answer composer

AI must never answer without retrieved verified context.

If retrieved context is insufficient, do not guess.

## Tech Stack

Use this stack unless explicitly changed:

- TypeScript
- Node.js
- pnpm
- Discord.js v14
- Next.js
- Supabase
- PostgreSQL
- pgvector

Do not add random packages. Add a dependency only when it solves a clear project need, and explain why in the implementation notes or pull request.

## Repository Structure

Planned structure:

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

Do not create these folders until the relevant implementation phase starts.

## Answering Rules

- Every user-facing answer must come from verified FAQ records or retrieved verified context.
- Every answer must include source citation data.
- If no matching verified source is found, send `ยังไม่พบข้อมูลที่ยืนยันได้จากฐานข้อมูลของระบบ`.
- Log every question, including answered, unanswered, low-confidence, and feedback events.
- Do not invent answers.
- Do not use model knowledge as a source of truth.
- Do not summarize or transform a source in a way that changes meaning.
- Do not answer from AI unless verified context was retrieved first and passed into the AI step.

## Data Rules

- FAQ or knowledge entries must include answer text, source title, source URL or reference, verification status, and last reviewed date.
- Only verified entries may be used for production answers.
- Unverified, draft, or stale records must not be served as final answers unless explicitly marked safe by project rules.
- Question logs must avoid collecting unnecessary personal data.
- Do not hardcode university data that should live in the knowledge database.
- Do not use AI to automatically import production knowledge.

## Security Rules

- Never hardcode secrets.
- Use environment variables.
- Never commit `.env`.
- Service role keys must only be used server-side.
- Validate all user input.
- Log errors safely without leaking tokens, keys, or private student data.

## Validation Rules

- Validate Discord command input before searching.
- Validate required environment variables at startup.
- Validate FAQ or knowledge records before importing or serving them.
- Validate that every answer has at least one citation before sending it.
- Validate failure paths, including no result, ambiguous result, invalid input, missing configuration, and external service failure.

## Quality Rules

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

Fix all errors before finishing. If a command cannot run because the relevant project phase has not created code yet, say that explicitly in the final summary.

## Work Style

- Implement one phase at a time.
- Do not start the next phase unless explicitly instructed.
- At the end of each phase, update `IMPLEMENTATION_PLAN.md`.
- At the end of each phase, summarize changed files, implemented features, and validation results.
- Keep features narrow and directly tied to verified Q&A.
- Prefer deterministic knowledge lookup before adding AI.
- Build logging and review workflows before expanding answer automation.

## AI Rules

AI is a later phase only.

AI may be used only when all are true:

- A verified source retrieval step has already found relevant context.
- The prompt explicitly instructs the model to answer only from that context.
- The response preserves citations.
- The system has a fallback when the model cannot answer from context.
- Tests cover unsupported questions and citation requirements.

AI must never answer from general model knowledge.

## Discord Rules

- Use slash command `/ask` as the primary interface.
- Keep responses focused on answering the submitted question.
- Include feedback buttons after answers and no-answer responses.
- Do not add moderation, leveling, voice, game, calendar, announcement, LFG, or activity tracking behavior.
- Prefer concise answers with citations over chatty responses.
- Handle Discord API errors gracefully.

## Done Criteria For Future Code

A Q&A feature is done only when:

- It uses verified FAQ or knowledge data.
- It cites sources.
- It logs questions and feedback.
- It handles invalid input.
- It has type safety, error handling, logging, and input validation.
- It has tests or documented validation for success and failure paths.
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass when code exists.
- It does not introduce unrelated Discord bot features.

