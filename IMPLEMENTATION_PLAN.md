# Campus Discord Q&A Bot - Implementation Plan

## Phase 0: Project Foundation

Goal: Define the project scope and safe implementation path.

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

## Phase 1: Minimal Discord Slash Command

Goal: Create the smallest working `/ask` flow without AI.

Deliverables:

- Discord bot application setup
- Slash command registration for `/ask`
- Input validation
- Basic response path
- Startup environment validation

Success criteria:

- A student can submit `/ask question:...`
- Invalid or empty questions are rejected clearly.
- The bot does not answer from AI or hardcoded guesses.

## Phase 2: Verified FAQ Database

Goal: Store approved Q&A records with source metadata.

Deliverables:

- FAQ schema
- Source citation fields
- Verification status field
- Last reviewed date field
- Seed/import process for verified entries
- Validation for FAQ records

Success criteria:

- Only verified FAQ records can be served.
- Every answerable record has citation metadata.
- Bad or incomplete records fail validation.

## Phase 3: Deterministic FAQ Lookup

Goal: Answer questions from verified FAQ data only.

Deliverables:

- Simple search or matching over verified FAQ entries
- Answer formatting with citation
- No-result response
- Ambiguous-result handling
- Logging for unanswered questions

Success criteria:

- Known questions return correct cited answers.
- Unknown questions produce a clear "not found" response.
- All unanswered questions are logged for review.
- No response is sent without a citation.

## Phase 4: Question Logging And Review Workflow

Goal: Help maintainers improve coverage safely.

Deliverables:

- Question log storage
- Fields for question text, timestamp, match status, and selected FAQ record
- Review status for unanswered questions
- Minimal admin or offline review process

Success criteria:

- Maintainers can see common unanswered questions.
- Logs do not collect unnecessary personal data.
- New FAQ entries can be added only after verification.

## Phase 5: Search Engine Upgrade

Goal: Improve retrieval while preserving correctness and citations.

Deliverables:

- Search index over verified FAQ records
- Ranking and confidence thresholds
- Citation-preserving result format
- Tests for irrelevant and ambiguous matches

Success criteria:

- Search improves recall without allowing uncited answers.
- Low-confidence results fall back to "not found" or clarification.
- Search uses only verified records.

## Phase 6: AI-Grounded Answering

Goal: Optionally use AI to phrase answers from retrieved verified context.

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

## Phase 7: Operations And Quality

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
- FAQ data can be protected and restored.
- Core Q&A behavior is covered by tests.

