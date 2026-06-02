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

## Cloudflare Worker AI Integration

Status: complete.

Goal: Connect the Discord Interaction Webhook `/ask` flow to an AI answer composer while keeping verified Supabase FAQ data as the source of truth.

Completed scope:

- Cloudflare Worker app under `apps/worker`.
- Discord Interaction Webhook route:
  - `GET /health`
  - `POST /discord`
  - Ed25519 signature verification
  - Discord PING response
  - deferred response type `5` for `/ask`
  - background processing with `ctx.waitUntil`
  - original interaction response edit through Discord webhook token
- Supabase FAQ search in Worker:
  - active FAQs only
  - exact question match
  - alias match
  - keyword match
  - question logging best-effort without blocking responses
- Worker AI integration:
  - `AIProvider` interface using verified contexts
  - Gemini provider as first provider
  - provider factory for future Groq/OpenAI-style providers
  - `AI_PROVIDER`, `GEMINI_API_KEY`, and `GEMINI_MODEL` Worker env support
  - direct FAQ answer for confidence `>= 90`
  - no AI call for confidence `< 70`
  - AI call only for confidence `70-89` with verified context
  - safe fallback to direct FAQ answer when AI fails
  - not-found response when no verified context exists
- Logging fields for AI usage, provider, model, confidence, and failure reason without logging secrets.
- Worker AI decision tests for high confidence, low confidence, empty contexts, AI usage, fallback, and secret-safe output.

Not included:

- No embeddings.
- No document import changes.
- No Discord Gateway bot.
- No normal message reading.
- No unrelated Discord features.

Validation results:

- `corepack pnpm install` passed.
- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed.

## FAQ Metadata Schema Update

Status: complete.

Goal: Support richer verified FAQ metadata for university Q&A records.

Completed scope:

- Added a Supabase migration for FAQ metadata fields:
  - `faq_code`
  - `audience`
  - `faculty_group`
  - `answer_short`
  - `answer_full`
  - `source_page`
  - `source_quote`
  - `valid_from`
  - `valid_until`
  - `priority`
- Updated `sources.source_type` default to `document`.
- Expanded FAQ status constraint to `active`, `draft`, `expired`, and `inactive`.
- Added FAQ priority constraint for `high`, `medium`, and `low`.
- Added `faq_relations` for related FAQ links.
- Added indexes for FAQ code, audience, faculty/group, validity dates, and source URL.
- Backfilled `faq_code` and `answer_short` from existing FAQ rows.
- Updated TypeScript types for:
  - `FAQ`
  - `FAQAlias`
  - `FAQKeyword`
  - `FAQRelation`
  - `Source`
  - `FAQImportRow`
  - `FAQImportResult`
- Kept the legacy `answer` field available in TypeScript/service mapping as a compatibility alias while `answer_short` becomes the canonical Discord response field.
- Updated admin/database insert paths to provide required metadata defaults for new FAQ rows.
- Updated seed SQL so fresh Supabase seed data satisfies the new `faq_code` and `answer_short` requirements.

Not included:

- No AI changes.
- No embedding changes.
- No Discord behavior changes.
- No CSV import implementation.

Validation results:

- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.

## Discord Ask Metadata Response Update

Status: complete.

Goal: Update Discord `/ask` responses to use enriched FAQ metadata.

Completed scope:

- Expanded knowledge search result metadata carried into Discord responses:
  - `answer_short`
  - `answer_full`
  - `category`
  - `audience`
  - `faculty_group`
  - `source_page`
  - `source_quote`
  - `valid_from`
  - `valid_until`
  - `priority`
  - FAQ `status`
- Updated Discord.js bot embed format:
  - title `คำตอบจากฐานข้อมูล`
  - `คำถาม`
  - `คำตอบ` from `answer_short`
  - `หมวดหมู่`
  - `สำหรับ`
  - optional `คณะ/กลุ่ม`
  - `แหล่งข้อมูล`
  - optional `หน้า/หัวข้ออ้างอิง`
  - `ตรวจสอบล่าสุด`
  - `สถานะข้อมูล`
- Updated Cloudflare Worker embed format to use the same metadata response shape.
- Added validity warning when `valid_until` is in the past.
- Kept `/ask` search serving active FAQ records only.
- Limited Discord.js `/ask` answerable methods to exact question, alias, and keyword results for this update.
- Question logs continue to record user question, matched FAQ id, confidence, method, response time, Discord user id, and guild id.

Not included:

- No new AI implementation.
- No vector search implementation.
- No new fuzzy search implementation.
- No unrelated Discord features.

Validation results:

- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed.

## Admin CSV FAQ Import

Status: complete.

Goal: Allow admins to upload prepared FAQ CSV files from the Vercel admin dashboard and import them into Supabase.

Completed scope:

- Added reusable CSV FAQ import logic in `packages/database`:
  - exact header validation
  - whitespace normalization
  - citation marker removal
  - comma splitting for aliases, keywords, and related FAQ IDs
  - required field validation
  - status, priority, date, URL, and duplicate FAQ ID validation
  - dry-run summary
  - commit import into Supabase using service role credentials server-side only
- Updated `/import` admin page for FAQ CSV upload.
- Added required header display.
- Added dry-run preview with created/updated/skipped counts.
- Added row-level validation error table.
- Added explicit confirmation checkbox before real import.
- Added API routes:
  - `POST /api/import/faqs/dry-run`
  - `POST /api/import/faqs/commit`
- Added configurable CSV file size limit with `FAQ_CSV_IMPORT_MAX_BYTES`.
- CSV upload is admin-only, server-side, and accepts CSV files only.

Not included:

- No document/PDF import changes.
- No AI-generated FAQ drafts.
- No embeddings.
- No unrelated admin pages.

Validation results:

- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed.

## Worker AI Composer Reconnection

Status: complete.

Goal: Connect the Cloudflare Worker `/ask` flow to the AI answer composer while keeping verified Supabase FAQ data as the source of truth.

Completed scope:

- Reconnected Worker `/ask` to `AIProviderFactory`.
- Worker now reads AI provider configuration from Worker env:
  - `AI_PROVIDER`
  - `GEMINI_API_KEY`
  - `GEMINI_MODEL`
- Preserved safe AI policy in the Worker answer composer:
  - confidence `>= 90`: direct FAQ answer, no AI call
  - confidence `< 70`: no AI call, not-found response
  - confidence `70-89`: AI call only when verified context exists and provider is configured
- Final Discord response uses the composed answer when AI is allowed.
- AI failures fall back to the direct verified FAQ answer.
- Logs include AI usage, provider, model, confidence, method, failure reason, and response time without logging secrets.

Not included:

- No embeddings.
- No document import changes.
- No unrelated Discord features.

Validation results:

- `corepack pnpm lint` passed.
- `corepack pnpm typecheck` passed.
- `corepack pnpm build` passed.
- `corepack pnpm test` passed.
