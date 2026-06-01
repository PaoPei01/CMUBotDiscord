# Campus Discord Q&A Bot - Project Rules

## Mission

Build a verified Discord Q&A bot for university students. The bot answers student questions only from approved, cited university FAQ content.

This project is not a general AI chatbot and not a Discord community management bot.

## Product Scope

Only build Q&A features:

- Discord slash command `/ask`
- Verified FAQ database
- Source citation on every answer
- Question logging
- Search engine later
- AI later, only when grounded in retrieved verified context

Do not build:

- General AI chat
- AI answers without verified database context
- Moderation
- Voice channel features
- Leveling or XP
- Game matching
- Calendar features
- Announcement systems
- Community management tools

## Priorities

When tradeoffs are needed, choose in this order:

1. Correctness
2. Source citation
3. Speed
4. Low cost
5. AI features

Correct, cited answers are more important than conversational style or model intelligence.

## Answering Rules

- Every user-facing answer must come from verified FAQ records or retrieved verified context.
- Every answer must include source citation data.
- If no matching verified source is found, the bot must say it does not know and log the question for review.
- Do not invent answers.
- Do not use model knowledge as a source of truth.
- Do not summarize or transform a source in a way that changes meaning.
- Do not answer from AI unless verified context was retrieved first and passed into the AI step.

## Data Rules

- FAQ entries must include answer text, source title, source URL or reference, verification status, and last reviewed date.
- Only verified entries may be used for production answers.
- Unverified, draft, or stale records must not be served as final answers unless explicitly marked safe by project rules.
- Question logs must avoid collecting unnecessary personal data.
- Do not hardcode university data that should live in the FAQ database.

## Validation Rules

- Validate Discord command input before searching.
- Validate required environment variables at startup.
- Validate FAQ records before importing or serving them.
- Validate that every answer has at least one citation before sending it.
- Validate failure paths, including no result, ambiguous result, invalid input, and missing configuration.

## Implementation Rules

- Keep features narrow and directly tied to verified Q&A.
- Add packages only when they solve a clear project need, and explain the reason in the implementation notes or pull request.
- Prefer simple, maintainable code over premature AI or search complexity.
- Build deterministic FAQ lookup before adding AI.
- Build logging and review workflows before expanding answer automation.
- Keep secrets in environment variables only.
- Do not commit `.env` files or API keys.

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
- Do not add moderation, leveling, voice, game, calendar, or announcement behavior.
- Prefer concise answers with citations over chatty responses.
- Handle Discord API errors gracefully.

## Done Criteria For Future Code

A Q&A feature is done only when:

- It uses verified FAQ data.
- It cites sources.
- It logs unanswered or low-confidence questions.
- It handles invalid input.
- It has tests for success and failure paths.
- It does not introduce unrelated Discord bot features.

