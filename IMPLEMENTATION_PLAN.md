# Campus Discord Q&A Bot - Implementation Plan

## Phase Policy

Implement one phase at a time. Do not start the next phase unless explicitly instructed.

At the end of each phase:

- Summarize changed files.
- Summarize implemented features.
- List validation results.
- Update this file.
- Commit and push completed work unless instructed otherwise.

Before completing any implementation phase with code, run:

```sh
pnpm lint
pnpm typecheck
pnpm build
```

Fix all errors before finishing.

## Phase 0: Project Foundation

Status: complete.

Goal: Define project scope, constraints, planned stack, and safe implementation path.

Deliverables:

- Project rules in `AGENTS.md`
- Implementation plan in `IMPLEMENTATION_PLAN.md`
- Setup instructions in `README.md`
- Secret placeholders in `.env.example`
- Git ignore rules in `.gitignore`

Success criteria:

- Contributors understand this is a verified Q&A bot only.
- Contributors know not to build general AI chat or Discord community features.
- Required configuration is documented before code exists.
- The long-term retrieval order is documented.
- The no-answer Thai fallback text is documented.

## Phase 1: Monorepo And Tooling Setup

Goal: Create the TypeScript/pnpm workspace without implementing bot behavior yet.

Planned stack:

- TypeScript
- Node.js
- pnpm
- Discord.js v14
- Next.js
- Supabase
- PostgreSQL
- pgvector

Planned repository structure:

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

Deliverables:

- `pnpm-workspace.yaml`
- Root package scripts for `lint`, `typecheck`, and `build`
- Shared TypeScript configuration
- Minimal package/app placeholders only where needed
- Dependency notes explaining every added package

Success criteria:

- `pnpm lint`, `pnpm typecheck`, and `pnpm build` exist.
- Workspace structure matches the documented architecture.
- No Discord features are implemented yet.
- No unrelated packages are added.

## Phase 2: Minimal Discord `/ask` Command

Goal: Create the smallest working `/ask` flow without AI and without production knowledge lookup.

Deliverables:

- Discord bot app in `apps/bot`
- Discord.js v14 setup
- Slash command registration for `/ask`
- Input validation for the `question` option
- Startup environment validation
- Safe error logging

Success criteria:

- A student can submit `/ask question:...`.
- Invalid or empty questions are rejected clearly.
- The command does not answer from AI or hardcoded guesses.
- Missing environment variables fail fast.
- Validation commands pass.

## Phase 3: Database Schema

Goal: Define verified knowledge and question logging storage.

Deliverables:

- Supabase/PostgreSQL schema for verified knowledge entries
- Source citation fields
- Alias fields for alias match
- Verification status field
- Last reviewed date field
- Question log table
- Feedback event table
- Server-side-only handling plan for service role keys

Success criteria:

- Only verified records can be selected for production answers.
- Every answerable record has citation metadata.
- Logs avoid unnecessary personal data.
- Bad or incomplete records fail validation.

## Phase 4: Exact FAQ Match

Goal: Answer only exact verified FAQ matches.

Deliverables:

- Exact match lookup in `packages/knowledge`
- Answer formatter with source citation
- Thai no-answer fallback:

```text
ยังไม่พบข้อมูลที่ยืนยันได้จากฐานข้อมูลของระบบ
```

- Question logging for answered and unanswered questions
- Feedback buttons on responses

Success criteria:

- Exact known questions return correct cited answers.
- Unknown questions return the exact fallback text.
- All questions are logged.
- All responses include feedback buttons.
- No response is sent without required source handling.

## Phase 5: Alias And Keyword Match

Goal: Improve deterministic lookup without AI.

Deliverables:

- Alias match
- Keyword match
- Confidence thresholds
- Ambiguous result handling
- Tests or validation for irrelevant and ambiguous matches

Success criteria:

- Alias and keyword matches use only verified records.
- Low-confidence results fall back safely.
- Ambiguous results do not produce guessed answers.
- Citations remain required.

## Phase 6: Full-Text Search

Goal: Add PostgreSQL full-text search over verified knowledge.

Deliverables:

- Full-text search query or index
- Ranking rules
- Confidence thresholds
- Citation-preserving result format

Success criteria:

- Search improves recall without allowing uncited answers.
- Search uses only verified records.
- Low-confidence results return the fallback text.

## Phase 7: Vector Search With pgvector

Goal: Add semantic retrieval while preserving correctness.

Deliverables:

- pgvector extension usage
- Embedding storage for verified records
- Vector search thresholding
- Retrieval logging for analysis

Success criteria:

- Vector search cannot return unverified records.
- Retrieved context always includes source metadata.
- Insufficient context returns the fallback text.

## Phase 8: AI Answer Composer

Goal: Optionally use AI to compose answers from retrieved verified context.

Deliverables:

- Retrieval-before-generation pipeline
- Prompt that restricts answers to verified context
- Citation preservation
- Refusal behavior when context is insufficient
- Cost controls and rate limits
- Regression tests for unsupported questions

Success criteria:

- AI never answers without retrieved verified context.
- AI responses include citations.
- Unsupported questions are refused safely.
- The system remains useful if AI is disabled.

## Phase 9: Admin Review App

Goal: Help maintainers review unanswered questions and manage verified knowledge.

Deliverables:

- Next.js admin app in `apps/admin`
- Supabase authentication plan
- Review workflow for unanswered questions
- Knowledge entry create/edit flow with validation
- No automatic production import from AI

Success criteria:

- Maintainers can review common unanswered questions.
- New production knowledge requires verification.
- Service role keys are server-side only.
- Admin actions are logged safely.

## Phase 10: Operations And Quality

Goal: Make the bot reliable for campus use.

Deliverables:

- Deployment instructions
- Runtime health checks
- Error logging
- Backup and restore notes for FAQ data
- Test coverage for core Q&A behavior

Success criteria:

- The bot can be deployed repeatably.
- Failures are visible to maintainers.
- Knowledge data can be protected and restored.
- Core Q&A behavior is covered by tests.

