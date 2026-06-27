# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Virtual Gym Coach** — a web app where users chat 1:1 with an AI "elite gym coach" persona (modeled on a trainer who has prepared world-class athletes). Core experience is a single conversational thread that delivers personalized training, nutrition, recovery, and mindset coaching.

Design north star: **clean, minimalist, beautiful**. A quiet studio, not a noisy gym app. Every change should defend whitespace and restraint — resist feature/UI bloat.

See `PRD_GymVirtual Gym Coach.md` for full product context.

## Always follow below pre-requisites
- Always read PLANNING.md at the start of every conversation
- Check TASKS.md before starting your work
- Mark completed tasks immediately
- Add newly discovered tasks

## Core Principles (read before any change)

1. **Minimalism is a requirement, not a preference.** One focal point per screen, generous whitespace, no badges/gamification/noise. If a feature adds clutter, push back or hide it behind progressive disclosure.
2. **The Coach persona is the product.** Quality of the system prompt and voice matters more than UI features. Treat the persona prompt as critical code.
3. **Safety guardrails are non-negotiable.** The Coach is not a medical professional. Never impersonate real named athletes or reference private athlete data. Always defer pain/injury/health questions to a doctor. Avoid extreme/unsafe diet or training advice.
4. **Conversation-first.** The chat thread is the center of gravity. Everything else (history, saved plans, profile) is supporting cast.

## Architecture

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript, `src/` layout, import alias `@/*`.
- **UI:** Tailwind CSS v4 (CSS-first), shadcn/ui v4 (Radix/Nova preset), Fraunces + Inter Tight (display), Inter (body).
- **AI layer:** Anthropic Claude SDK (`@anthropic-ai/sdk`), streamed via Next.js Route Handlers (SSE).
- **Backend:** Next.js API routes; Auth.js v5 (email + Google OAuth + guest); Prisma v7 + PostgreSQL.
- **Database:** Local: Docker (`docker compose up -d`), prod: Neon/Supabase.

### Key commands
```
npm run dev       # start dev server (http://localhost:3000)
npm run build     # production build
npm run lint      # ESLint
npm run format    # Prettier
npm test          # Vitest unit tests (src/**/*.spec.tsx)
npm run test:e2e  # Playwright e2e tests (tests/)
npx prisma migrate dev  # run migrations
```

## Layout Conventions

- Centered conversation column, max ~720px, for readability.
- Slim, collapsible left rail for history + saved plans.
- Persistent, unobtrusive input bar pinned to bottom.
- Coach and user messages visually distinct but harmonious.

## Design Tokens

Use these tokens; do not introduce new colors without a strong reason.

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#FAFAF8` | App canvas (warm off-white) |
| `--ink` | `#1A1A1A` | Primary text |
| `--muted` | `#6B6B6B` | Secondary text |
| `--accent` | `#C8553D` | CTAs, highlights (terracotta) |
| `--surface` | `#FFFFFF` | Message cards, panels |

- **Display/headings:** refined serif or geometric sans (e.g. Fraunces / Inter Tight).
- **Body:** highly legible sans (e.g. Inter).
- **Motion:** subtle only — gentle fades, smooth streaming. Never decorative.

## What to Build (MVP scope)

In scope for v1: chat + streaming, the Coach persona, lightweight skippable onboarding (goal / level / environment), conversation history, saved plans, accounts (email + Google OAuth, guest mode).

Out of scope for v1 — do not build without explicit instruction: human coaching/marketplace, wearable integrations, social/community features, native mobile apps, medical/clinical advice.

## Coding Conventions

- Match existing patterns in the codebase before introducing new ones.
- Prefer small, composable components; keep the chat column logic isolated from chrome (rail, input bar).
- All user-facing copy should match the Coach's voice: calm, confident, direct, encouraging — no hype.
- Markdown rendering in messages must support headings, lists, and tables (the Coach returns structured plans).
- Accessibility is required, not optional: WCAG 2.1 AA — keyboard nav, contrast, screen-reader labels.

## Performance & Reliability Targets

- First token streams in under ~2 seconds.
- Graceful handling of model timeouts with retry.
- Conversations encrypted at rest; provide a clear data-deletion path.

## Guardrails for the Coach Prompt

When editing the system prompt or persona logic, preserve all of these:

- Identifies as an AI coach drawing on elite-level coaching experience — never claims to BE a specific real person.
- Never invents or references real athletes' private/training data.
- Asks clarifying questions (goal, level, equipment, constraints) before prescribing.
- Inserts a not-a-doctor disclaimer and recommends professional consultation for pain, injury, or health conditions.
- Refuses extreme/unsafe recommendations (crash diets, dangerous progressions).

## When Unsure

- If a change risks the minimalist design or the safety guardrails, stop and ask.
- Don't expand scope beyond the current phase without confirmation.
- Keep `PRD_GymVirtual Gym Coach.md` and this file in sync when product decisions change.

## Conventions for Updating This File

As the project takes concrete shape, replace the "intended"/"e.g." placeholders above with real values: chosen framework, install/build/test/lint commands, directory structure, and environment setup. Keep this file short and high-signal.
