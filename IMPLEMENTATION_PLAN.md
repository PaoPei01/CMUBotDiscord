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
pnpm install
pnpm lint
pnpm typecheck
pnpm build
```

Fix all errors before finishing.

## Phase 1: Foundation

Status: complete.

Goal: Create the monorepo foundation.

Completed scope:

- pnpm workspace
- TypeScript strict mode
- ESLint
- Prettier
- Shared TypeScript config
- Environment validation helper
- Logging utility
- Basic Node TypeScript bot startup with health log only
- Basic Next.js admin app with homepage text `Campus Q&A Admin`
- Package placeholders for shared, database, knowledge, and AI

Not included:

- No Discord login or commands
- No database tables or migrations
- No AI provider implementation
- No unrelated features

Validation results:

- `corepack pnpm install` passed.
- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.

Note: The local environment does not expose a direct `pnpm` shim, so validation used `corepack pnpm`, which runs the pinned pnpm version from `packageManager`.

## Phase 2: Database

Goal: Create verified FAQ database schema.

Tables:

- `faqs`
- `faq_aliases`
- `faq_keywords`
- `sources`
- `question_logs`
- `feedback`

Done when:

- Supabase migration exists.
- TypeScript database types exist.
- Seed data can be inserted.
- Basic queries work.

## Phase 3: Discord Bot MVP

Goal: Build basic Discord Q&A bot.

Commands:

- `/ping`
- `/ask`

Scope:

- Discord.js v14 setup
- Slash command registration
- Command handler
- Exact FAQ search
- Answer with source
- Unanswered question logging

Done when:

- `/ping` works.
- `/ask` works.
- FAQ answer is returned.
- Source citation is shown.
- Unknown question is logged.

## Phase 4: Admin Minimal

Goal: Create basic admin interface for FAQ management.

Pages:

- FAQ list
- Create FAQ
- Edit FAQ
- Source list

Done when:

- Admin can add FAQ.
- Admin can edit FAQ.
- Bot can answer newly added FAQ.

## Phase 5: Better Search

Goal: Improve retrieval without AI.

Search layers:

- Exact match
- Alias match
- Keyword match
- Full-text search
- Fuzzy search

Done when:

- Misspelled or varied questions still find the right verified FAQ.

## Phase 6: Vector Search

Goal: Add semantic search.

Scope:

- pgvector
- Embeddings table or embedding column
- Embedding provider abstraction
- Vector similarity search

Done when:

- Semantically similar questions match the correct verified FAQ.

## Phase 7: AI Answer Composer

Goal: Use AI only to rewrite answers from verified context.

Rules:

- AI cannot answer without retrieved context.
- AI cannot invent facts.
- AI must cite sources.

Done when:

- AI creates natural answers from existing FAQ/context.
- No-context questions return the not-found response.

## Phase 8: Knowledge Import Drafts

Goal: Generate draft FAQs from documents.

Supported:

- PDF
- DOCX
- TXT
- URL

Rules:

- AI-generated FAQ goes to draft only.
- Admin must approve before production.

Done when:

- Document creates draft FAQs.
- Admin can approve or reject.
- Approved draft becomes production FAQ.

