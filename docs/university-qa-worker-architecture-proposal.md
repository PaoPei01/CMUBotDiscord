# University Discord Q&A Bot Architecture Proposal

## Scope

ออกแบบบอท Q&A สำหรับนักศึกษาโดยใช้ Cloudflare Workers + Supabase เป็นแกนหลัก บอทต้องตอบจาก FAQ/knowledge ที่ตรวจสอบแล้วเท่านั้น ไม่ใช่ general chatbot และ AI ต้องใช้ได้เฉพาะการเรียบเรียงคำตอบจาก retrieved verified context เท่านั้น

## References Reviewed

- [discord/cloudflare-sample-app](https://github.com/discord/cloudflare-sample-app): ตัวอย่าง Discord Interaction Webhook บน Cloudflare Workers, signature verification, PING/PONG, command registration, Worker secrets
- [ahmedrangel/discord-app-workers-template](https://github.com/ahmedrangel/discord-app-workers-template): template โครงสร้าง Worker สำหรับ slash commands, router, env, command registration
- [AnswerOverflow/AnswerOverflow](https://github.com/AnswerOverflow/AnswerOverflow): แนวคิดแปลงความรู้จาก Discord threads ให้ค้นพบได้, แยก apps/packages, admin/content indexing workflow
- [erikzimmermann/discord-auto-faq](https://github.com/erikzimmermann/discord-auto-faq): แนวคิด AutoFAQ ด้วย similarity threshold ระหว่างข้อความผู้ใช้กับ FAQ triggers
- [modmail-dev/Modmail](https://github.com/modmail-dev/Modmail): shared inbox, thread/log workflow, staff review, searchable logs
- [Cog-Creators/Red-DiscordBot](https://github.com/Cog-Creators/Red-DiscordBot): plugin/cog modularity, enable/disable feature boundaries, third-party extension model

## Key Learnings

### Cloudflare Worker Discord Pattern

- ใช้ Discord Interaction Webhook แทน Gateway bot สำหรับ `/ask`
- Worker route รับ `POST /discord`, อ่าน raw body, verify `X-Signature-Ed25519` และ `X-Signature-Timestamp`
- ตอบ `PING` ด้วย `{ type: 1 }`
- สำหรับคำถามจริงให้ตอบ deferred response `{ type: 5 }` ทันที แล้วใช้ `ctx.waitUntil()` ประมวลผลต่อ
- ใช้ Discord webhook edit endpoint เพื่อแก้ original interaction response เมื่อค้นหาเสร็จ
- เก็บ secrets ใน Worker secrets เท่านั้น เช่น Discord public key, Supabase service role, AI key

Inspired by: `discord/cloudflare-sample-app`, `discord-app-workers-template`

### Knowledge/Q&A Pattern

- แยก retrieval ออกจาก answer formatting
- ค้นจาก deterministic layer ก่อน: exact, alias, keyword, full-text
- similarity/semantic layer ควรใช้ threshold ชัดเจน และต้อง log confidence/method
- AI ไม่ควรเป็น source of truth แต่เป็น answer composer หลังจากมี context แล้ว
- unanswered questions และ feedback เป็นวัตถุดิบสำคัญสำหรับ admin review

Inspired by: `discord-auto-faq`, `AnswerOverflow`

### Admin/Review Pattern

- ความรู้ที่มาจาก user, thread, import, หรือ AI extraction ต้องเข้าคิว review ก่อน production
- staff ควรเห็น missing questions, candidate FAQs, source quote, duplicate warning, และประวัติการแก้ไข
- logs ควร searchable และผูกกับ user question, answer result, confidence, source, feedback

Inspired by: `AnswerOverflow`, `Modmail`

### Plugin/Modularity Pattern

- Core bot ควรเล็กและมั่นคง: interaction, retrieval, answer, logging
- ส่วนเสริมควรเป็น module ที่เปิด/ปิดได้ เช่น feedback, natural Q&A, AI composer, review queue, modmail handoff
- แต่ละ module ต้องประกาศ input/output, env ที่ใช้, database tables ที่แตะ, และ safety policy

Inspired by: `Red-DiscordBot`, `Modmail`

## Proposed Architecture

```text
Discord /ask
  -> Cloudflare Worker /discord
  -> verify Discord signature
  -> deferred interaction response
  -> InputValidator
  -> KnowledgeSearchService
      1. exact FAQ
      2. alias
      3. keyword
      4. full-text
      5. vector search later
  -> AnswerPolicy
      confidence >= 90: direct verified answer
      confidence 70-89: optional AI composer with verified context
      confidence < 70: not found
  -> ResponseFormatter
  -> QuestionLogger + FeedbackLogger
  -> edit original Discord response
```

## Current Implementation Alignment

- Cloudflare Worker is the primary `/ask` runtime.
- Gateway `apps/bot` keeps `/ask` available for compatibility, but its main runtime-only responsibility is natural Q&A via `messageCreate`.
- Natural Q&A remains behind feature flag, channel allowlist, and mention/prefix guard.
- Worker and Gateway answer composition now share the same verified answer policy:
  - confidence `>= 90`: answer directly from verified FAQ and do not call AI
  - confidence `70-89`: answer only when verified context/source exists; AI may rewrite that context only
  - confidence `< 70`: do not answer and do not call AI
- Worker retrieval uses Supabase RPCs for exact, alias, and keyword matches before falling back to full-text and fuzzy logic, avoiding a full active FAQ table fetch on the common paths.
- If AI fails for confidence `70-89`, the system falls back to the direct verified FAQ answer.
- If verified context or citation source is missing, the system returns the not-found message instead of serving an uncited answer.
- Question logging is best-effort and must not block Discord responses.

## Suggested Modules

### Worker App

- `discord/verifyRequest`: signature verification
- `discord/respond`: deferred response, edit original response, error response
- `commands/ask`: extracts and validates question option
- `services/knowledgeSearch`: Supabase retrieval layers
- `services/answerPolicy`: decides direct answer, AI-composed answer, or not-found
- `services/questionLogging`: logs answered/unanswered questions
- `formatters/answerEmbed`: concise answer with citation and freshness warning

### Knowledge Package

- `normalizeText`
- `searchKnowledge`
- `confidenceScoring`
- `sourceCitationValidator`
- future: `vectorSearch`, `duplicateDetection`

### AI Package

- `AIProvider` interface
- `GeminiProvider`
- future: `GroqProvider`, `OpenAIProvider`
- `promptTemplates`
- `safetyGuard`

AI rule:

```text
AI can compose, not decide facts.
No retrieved verified context = no AI call.
Insufficient context = not-found response.
```

### Admin App

- FAQ CRUD
- CSV import
- missing questions review
- feedback review
- review queue actions: mark reviewed, create draft, link FAQ, add alias, add keyword
- future: draft FAQ approval, modmail-like handoff, audit log

## Database Ideas

### MVP Tables

- `sources`: source metadata, URL, last verified date
- `faqs`: verified answer records, status, audience, validity window
- `faq_aliases`: alternate question wording
- `faq_keywords`: deterministic keyword matching
- `question_logs`: every question, method, confidence, response time
- `feedback`: up/down votes and optional comments

### Phase 2 Tables

- `admin_review_items`: unanswered or low-confidence questions queued for review
- `faq_revisions`: change history for FAQ edits
- `source_checks`: source re-verification schedule/status
- `channel_settings`: per-guild/channel enablement and behavior

### Phase 3 Tables

- `faq_embeddings`: pgvector cache
- `draft_faqs`: AI/import generated drafts only
- `draft_keywords`
- `knowledge_import_jobs`
- `support_threads`: modmail-like escalation from unanswered questions
- `support_thread_messages`

## Interaction Patterns

### `/ask` MVP

1. User sends `/ask question`
2. Worker responds deferred immediately
3. Supabase search active FAQs only
4. If found, reply with answer, source, last verified, confidence label
5. If not found, reply exactly:

```text
ยังไม่พบข้อมูลที่ยืนยันได้จากฐานข้อมูลของระบบ
```

6. Log question and attach feedback buttons

### Feedback

- `ตรง`: reinforce FAQ quality
- `ไม่ตรง`: create review item
- optional comment modal later
- repeated negative feedback can lower FAQ review priority or mark for staff audit

### Natural Q&A Later

- Disabled by default
- Channel allowlist only
- Require mention or configured prefix
- Use the same KnowledgeSearchService and AnswerPolicy as `/ask`
- Never read normal messages outside configured channels

### Modmail-Like Escalation Later

- If not found, offer `ส่งให้ทีมตรวจสอบ`
- Create private support/review thread for staff
- Staff can answer once, then convert answer into draft FAQ
- Preserve audit trail and source requirement before production

## Plugin Points

Use a small internal module contract instead of a full public plugin marketplace at first:

```ts
type QaModule = {
  name: string
  enabled(env: Env): boolean
  registerCommands?(): DiscordCommand[]
  handleInteraction?(input: InteractionContext): Promise<ModuleResult>
  afterAnswer?(event: AnswerEvent): Promise<void>
}
```

Recommended future modules:

- `feedback-module`
- `natural-qa-module`
- `ai-composer-module`
- `review-queue-module`
- `import-module`
- `support-handoff-module`
- `analytics-module`

Keep plugin boundaries strict: no module can bypass AnswerPolicy or serve uncited answers.

## Prioritization

### MVP

- Cloudflare Worker `/discord`
- `/ask`
- deferred response
- active FAQ search: exact, alias, keyword
- citation-first answer embed
- not-found response
- question logs
- feedback buttons
- admin CSV import and FAQ management

### Phase 2

- PostgreSQL full-text search
- fuzzy matching with clear confidence threshold
- missing-question review queue
- FAQ revision history
- per-channel/guild settings
- source re-verification workflow
- natural Q&A layer behind channel allowlist

### Phase 3

- pgvector semantic search
- AI answer composer for confidence 70-89 only
- AI-generated draft FAQ import, never direct production
- duplicate detection
- modmail-like staff handoff for unresolved questions
- plugin/module registry for optional extensions

## Design Decisions

- Prefer Worker webhook over Gateway for `/ask`: faster deploy, lower ops burden, no long-running process
- Keep Supabase as source of truth: verified FAQ, source, logs, review data
- Keep AI outside retrieval correctness: AI only rewrites verified context
- Treat unanswered questions as product signal: review queue, source gap, FAQ improvement
- Use modular internal boundaries early, but delay public plugin complexity until core Q&A is stable

## Risks And Guardrails

- Risk: natural chat becomes general chatbot  
  Guardrail: channel allowlist, mention/prefix trigger, same AnswerPolicy as `/ask`

- Risk: AI invents facts  
  Guardrail: no context means no call, strict prompt, output safety check, source citation required

- Risk: stale university data  
  Guardrail: `last_verified_at`, `valid_until`, source review queue, warning on expired data

- Risk: service role key leakage  
  Guardrail: Worker/Admin server-side only, never browser, never logs

- Risk: plugin sprawl  
  Guardrail: modules cannot own core answer policy or bypass source validator
