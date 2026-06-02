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

Status: complete.

Goal: Improve retrieval without AI.

Search layers:

- Exact match
- Alias match
- Keyword match
- Full-text search
- Fuzzy search

Completed scope:

- `KnowledgeEngine` in `packages/knowledge`.
- `searchKnowledge(question)` returning answer, FAQ id, confidence, method, and source.
- Thai/English text normalization helpers.
- Exact, alias, keyword, deterministic full-text-style token overlap, and Fuse.js fuzzy search.
- `/ask` now uses `KnowledgeEngine` instead of exact-only lookup.
- User-facing low-confidence note for confidence `60-74`.
- Not-found response for confidence below `60`.
- Unit tests for normalization, exact, alias, keyword, and fuzzy confidence.

Not included:

- No AI implementation.
- No embeddings.
- No database schema changes.
- PostgreSQL full-text indexing/RPC is deferred; current `full_text` method uses deterministic token overlap with a TODO for indexed PostgreSQL retrieval.

Validation results:

- `corepack pnpm install` passed.
- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed.

## Phase 6: Vector Search

Status: complete.

Goal: Add semantic search.

Scope:

- pgvector
- Embeddings table or embedding column
- Embedding provider abstraction
- Vector similarity search

Completed scope:

- Supabase migration enabling `vector`, adding `faq_embeddings`, vector indexes, and `match_faq_embeddings` RPC.
- `EmbeddingProvider` interface plus `GeminiEmbeddingProvider` placeholder in `packages/ai`.
- Database service methods for existing embedding checks, FAQ embedding upsert, and vector similarity lookup.
- KnowledgeEngine vector layer after exact, alias, keyword, full-text, and fuzzy search.
- Vector confidence mapping:
  - high similarity returns confidence `75-90`
  - medium similarity returns confidence `60-75`
  - below threshold returns no result
- Server-side embedding scripts:
  - `pnpm embeddings:generate`
  - `pnpm embeddings:regenerate <faq-id>`
  - `pnpm embeddings:search <question>`
- Environment placeholders for `GEMINI_API_KEY`, `EMBEDDING_PROVIDER`, and `EMBEDDING_MODEL`.
- Unit test coverage for vector fallback confidence.

Not included:

- No AI answer composer.
- No AI-generated user answers.
- No Discord-side embedding provider calls; `/ask` does not configure a provider, so vector API calls only happen in explicit scripts or future server-side wiring.
- No production Gemini client implementation yet; the provider is a reviewed placeholder until a real embedding client is added.

Validation results:

- `corepack pnpm install` passed.
- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed.

## Phase 7: AI Answer Composer

Status: complete.

Goal: Use AI only to rewrite answers from verified context.

Rules:

- AI cannot answer without retrieved context.
- AI cannot invent facts.
- AI must cite sources.

Completed scope:

- `AIProvider` interface for `generateAnswer({ question, contexts })`.
- Gemini and Groq answer providers selected by `AI_PROVIDER` or inferred from configured API keys.
- Provider factory that returns `null` when no AI key is configured, preserving deterministic FAQ answers.
- Prompt template requiring:
  - answer only from provided verified knowledge
  - no outside knowledge
  - no guessing
  - exact not-found message when context is insufficient
  - source-name citations
- Safety guard that refuses empty contexts and rejects uncited AI answers.
- `/ask` AI policy:
  - confidence `>= 90`: return FAQ answer directly without AI
  - confidence `70-89`: use AI only when verified context and provider exist, otherwise fallback to the verified FAQ answer
  - confidence `< 70`: do not call AI and return the not-found response
- AI logging fields for provider, usage, prompt context count, and failure reason.
- Tests covering low-confidence no-call, no-context no-call, retrieved-context-only prompts, and provider failure fallback.

Not included:

- No document import.
- No AI answers without retrieved verified context.
- No client-side API key exposure.
- No removal of direct FAQ answer behavior.

Validation results:

- `corepack pnpm install` passed.
- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed.

## Phase 8: Knowledge Import Drafts

Status: complete.

Goal: Generate draft FAQs from documents.

Supported:

- PDF
- DOCX
- TXT
- Markdown
- URL

Rules:

- AI-generated FAQ goes to draft only.
- Admin must approve before production.

Completed scope:

- Supabase migration for:
  - `knowledge_sources`
  - `ingestion_jobs`
  - `draft_faqs`
  - `draft_keywords`
  - `knowledge_reviews`
  - `knowledge_import_logs`
- Knowledge ingestion pipeline:
  - file and URL validation
  - PDF, DOCX, TXT, Markdown, and URL parsing
  - text normalization
  - configurable chunking with default `1000` words and `150` overlap words
  - AI extraction prompt for explicit FAQ JSON only
  - draft candidate creation
  - duplicate detection by exact question, fuzzy similarity, and keyword overlap
- Admin pages:
  - `/import`
  - `/drafts`
  - `/drafts/[id]`
  - `/reviews`
- Draft actions:
  - approve
  - reject
  - edit
  - bulk approve
  - bulk reject
- Approval behavior:
  - approved drafts copy into `faqs`
  - draft keywords copy into `faq_keywords`
  - approval and rejection are logged
  - rejected drafts remain archived
  - duplicate drafts cannot be approved directly into production
- Security controls:
  - admin-only import/review pages and actions
  - server-side parsing and database writes
  - supported file type validation
  - configurable file size limit via `KNOWLEDGE_IMPORT_MAX_BYTES`
  - no public uploads
- Tests for parser validation, chunking, draft creation, approval workflow, and duplicate detection.

Not included:

- No change to `/ask` behavior.
- No direct import of AI-generated content into production FAQs.
- No automatic approval.

Validation results:

- `corepack pnpm install` passed.
- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed.
