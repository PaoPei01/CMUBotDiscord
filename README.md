# Campus Discord Q&A Bot

A verified Discord Q&A bot for university students.

The bot is designed to answer student questions from an approved FAQ database with source citations. It is intentionally not a general AI chatbot and not a Discord community management bot.

## Product Goal

Build a Discord bot that lets students ask questions with `/ask` and receive correct, cited answers from verified university FAQ content.

Priority order:

1. Correctness
2. Source citation
3. Speed
4. Low cost
5. AI features

## Core Features

- Discord slash command `/ask`
- Verified FAQ database
- Source citation on every answer
- Question logging for unanswered or low-confidence questions
- Search engine later
- AI later, only with retrieved verified context

## Non-Goals

This project must not become a general Discord bot.

Do not build:

- General AI chatbot behavior
- AI answers without database context
- Moderation tools
- Voice channel features
- Leveling or XP systems
- Game matching
- Calendar features
- Announcement systems

## Expected Answer Behavior

The bot should answer only when it finds relevant verified FAQ content.

If the bot cannot find verified source material, it should say it does not know and log the question for review. It should not guess, invent, or rely on general AI knowledge.

Every answer must include a citation.

## Setup

No application code has been implemented yet. These are the planned setup steps once implementation begins.

1. Create a Discord application in the Discord Developer Portal.
2. Create a bot user and copy the bot token.
3. Configure OAuth2 and invite the bot to the target server with slash command permissions.
4. Copy `.env.example` to `.env`.
5. Fill in required environment variables.
6. Start the application using the documented command added during implementation.
7. Register the `/ask` slash command.
8. Load verified FAQ records.
9. Test known, unknown, invalid, and ambiguous questions.

## Environment Variables

See `.env.example` for the required configuration placeholders.

Secrets must be stored in `.env` or the deployment platform secret store. Do not commit `.env` files or API keys.

## Data Requirements

FAQ records should include:

- Question or topic
- Verified answer
- Source title
- Source URL or reference
- Verification status
- Last reviewed date

Only verified records should be available for production answers.

## Development Rules

Read `AGENTS.md` before implementing code.

Key rules:

- Build only Q&A features.
- Validate input and configuration.
- Require citations for all answers.
- Log unanswered questions.
- Add packages only for clear, explained reasons.
- Do not hardcode API keys.
- Do not commit `.env` files.
- Do not add AI until retrieval from verified context exists.

## Implementation Plan

See `IMPLEMENTATION_PLAN.md` for phased delivery.

