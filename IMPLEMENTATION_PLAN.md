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

Status: complete.

Goal: Create verified FAQ database schema.

Tables:

- `faqs`
- `faq_aliases`
- `faq_keywords`
- `sources`
- `question_logs`
- `feedback`

Completed scope:

- Supabase migration for verified FAQ schema.
- Seed SQL with 15 prepared CMU new-student FAQs from the test CSV.
- TypeScript database/domain types for `FAQ`, `Source`, `SearchResult`, `QuestionLog`, and `Feedback`.
- TypeScript row coverage for `faq_aliases` and `faq_keywords`.
- Server-side database service functions:
  - `getActiveFaqs()`
  - `findFaqByExactQuestion(question)`
  - `logQuestion()`
  - `saveFeedback()`

Not included:

- No Discord bot command logic.
- No AI implementation.
- No vector search.
- No database migration execution against a remote Supabase project.

Validation results:

- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.

## Phase 3: Discord Bot MVP

Status: complete.

Goal: Build basic Discord Q&A bot.

Commands:

- `/ping`
- `/ask`

Completed scope:

- Discord.js v14 setup
- Guild slash command registration script
- Command handler for `/ping` and `/ask`
- Exact FAQ search through the database service
- Discord embed answer formatting with category, source, verification/update date, and confidence label
- Question logging for answered and unanswered questions
- Feedback buttons with vote save handler
- Safe user-facing error messages
- Startup, command execution, search method, feedback, and error logging

Not included:

- No AI implementation.
- No fuzzy search.
- No vector search.
- No unrelated Discord features.
- No normal chat message reading.

Validation results:

- `corepack pnpm install` passed.
- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.

## Phase 4: Admin Minimal

Status: complete.

Goal: Create basic admin interface for FAQ management.

Pages:

- `/faq` FAQ list with search, category filter, and status filter
- `/faq/new` create FAQ form
- `/faq/[id]/edit` edit FAQ form
- `/logs` recent question logs
- `/missing` unanswered question logs

Completed scope:

- Next.js admin pages for FAQ management and question review.
- FAQ create/edit forms covering category, question, answer, aliases, keywords, source name, source URL, last verified date, and status.
- Source create-or-update behavior by source name.
- Alias and keyword replacement on edit.
- MVP admin protection using `ADMIN_PASSWORD` and an httpOnly cookie.
- Server-side Supabase service-role access only; no service role key is exposed to browser code.
- Loading, error, and success states.

Not included:

- No full role-based auth.
- No AI import.
- No analytics charts.

Validation results:

- `corepack pnpm install` passed.
- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.

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
