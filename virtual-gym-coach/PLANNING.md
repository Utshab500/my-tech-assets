# PLANNING.md

High-level vision, architecture, technology stack, and required tooling for **CoachChat**. This is the engineering companion to `PRD_GymCoachChat.md` (product) and `CLAUDE.md` (working conventions). Stack choices below are recommended defaults — opinionated so the team can move fast — and can be revised before scaffolding.

---

## 1. Vision

CoachChat is a web app where users hold a quiet, one-on-one conversation with an AI "elite gym coach" — a persona drawing on the kind of expertise used to prepare world-class athletes. It delivers personalized training, nutrition, recovery, and mindset coaching through natural conversation.

The experience should feel **premium, calm, and effortless** — a quiet studio, not a noisy fitness app. Success means a user opens it, asks a question, and gets pro-level guidance that feels personal, in an interface so clean it disappears.

**Guiding tenets**
- Conversation is the product; everything else is supporting cast.
- Minimalism is a hard requirement — defend whitespace, resist clutter.
- The Coach's voice and safety guardrails are critical, prompt-engineered code.
- Tailored beats generic: capture goal, level, and equipment, then personalize.

---

## 2. Architecture

### 2.1 Shape

A single-page web client talks to a thin backend, which orchestrates the LLM and persists data. Responses stream token-by-token to the client.

```
┌──────────────┐     HTTPS / SSE      ┌──────────────────┐
│   Web Client │ ───────────────────▶ │   API / Backend  │
│  (Next.js)   │ ◀─────────────────── │  (Next.js API /  │
│              │   streamed tokens    │   Route Handlers)│
└──────────────┘                      └────────┬─────────┘
                                                │
                          ┌─────────────────────┼─────────────────────┐
                          ▼                      ▼                     ▼
                   ┌─────────────┐       ┌──────────────┐      ┌──────────────┐
                   │  LLM (Claude│       │   Database   │      │     Auth     │
                   │  via API)   │       │  (Postgres)  │      │ (Auth.js)    │
                   └─────────────┘       └──────────────┘      └──────────────┘
```

### 2.2 Key flows

**Chat turn**
1. Client sends user message + conversation id.
2. Backend loads conversation history + user profile, assembles the system prompt (persona + guardrails) and context.
3. Backend calls the LLM with streaming enabled.
4. Tokens stream back to the client over SSE and render progressively.
5. Completed message + any extracted profile facts are persisted.

**Personalization / memory**
- A lightweight user profile (goal, level, environment, constraints) is stored and injected as context each turn.
- Key facts surfaced in conversation can be written back to the profile so the Coach "remembers" across sessions.

**Saved plans**
- Any Coach message can be saved as a Plan (markdown snapshot) tied to the user.

### 2.3 Module boundaries

- `chat/` — conversation thread, streaming, message rendering. Isolated from app chrome.
- `coach/` — system prompt assembly, persona, guardrails, context injection. Treat as critical code.
- `profile/` — user profile read/write and fact extraction.
- `plans/` — saved plans.
- `auth/` — sessions, OAuth, guest mode.
- `ui/` — shared design-system primitives (tokens, typography, layout shells).

### 2.4 Design constraints

- Centered conversation column (~720px), slim collapsible left rail, pinned input bar.
- First token streaming in under ~2s; graceful timeout + retry.
- WCAG 2.1 AA. Conversations encrypted at rest; clear data-deletion path.

---

## 3. Technology Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js (App Router) + React + TypeScript** | One codebase for client + API, first-class streaming, strong ecosystem |
| Language | **TypeScript** (strict) | Type safety across client/server boundary |
| Styling | **Tailwind CSS** + CSS variables for design tokens | Fast, consistent, enforces the restrained token palette |
| UI primitives | **shadcn/ui + Radix** | Accessible, unstyled-by-default components that fit a minimalist look |
| LLM | **Anthropic Claude API** (streaming) | Strong instruction-following for persona + guardrails |
| Markdown | **react-markdown** + remark/rehype | Renders structured plans (headings, lists, tables) safely |
| Auth | **Auth.js (NextAuth)** — email + Google OAuth, guest mode | Standard, low-friction, supports guest sessions |
| Database | **PostgreSQL** | Relational fit for users, conversations, messages, plans |
| ORM | **Prisma** | Type-safe queries, migrations |
| Hosting | **Vercel** (app) + **managed Postgres** (e.g. Neon/Supabase) | Native Next.js streaming support, low ops |
| Validation | **Zod** | Runtime validation at API boundaries |
| State (client) | React state + lightweight store (e.g. Zustand) if needed | Keep it minimal; avoid heavy state libs |

**Notable non-goals for v1 stack:** no native mobile, no wearable SDKs, no microservices — keep it a single deployable app.

### Suggested data model (v1)

- `User` — id, email, auth provider, created_at.
- `Profile` — user_id, goal, experience_level, environment, constraints (JSON).
- `Conversation` — id, user_id, title, created_at, updated_at.
- `Message` — id, conversation_id, role, content (markdown), created_at.
- `Plan` — id, user_id, source_message_id, title, content (markdown), created_at.

---

## 4. Required Tools

### Developer machine
- **Node.js** (LTS, v20+) and **npm** (or pnpm) — runtime + package management.
- **Git** — version control.
- **Docker** (optional but recommended) — local Postgres without host installs.
- A modern editor (VS Code recommended) with ESLint + Prettier integration.

### Project dependencies (installed via package manager)
- `next`, `react`, `react-dom`, `typescript`
- `tailwindcss`, `postcss`, `autoprefixer`
- shadcn/ui + `@radix-ui/*`
- `@anthropic-ai/sdk` — Claude API client
- `react-markdown`, `remark-gfm`, `rehype-sanitize`
- `next-auth` (Auth.js)
- `prisma`, `@prisma/client`
- `zod`
- `zustand` (only if client state grows beyond React state)

### Tooling / quality
- **ESLint** + **Prettier** — linting and formatting.
- **Vitest** (unit) + **Playwright** (e2e) — testing.
- **Prisma Migrate** — database migrations.
- **Husky** + **lint-staged** (optional) — pre-commit checks.

### Services / accounts
- **Anthropic API key** — LLM access.
- **Google OAuth credentials** — social sign-in.
- **Managed Postgres** (Neon, Supabase, or RDS).
- **Vercel account** — deployment.

### Environment variables (expected)
```
ANTHROPIC_API_KEY=
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## 5. Build Phases

- **Phase 1 (MVP):** Chat + streaming, Coach persona + guardrails, lightweight onboarding, conversation history, saved plans, auth (email + Google + guest).
- **Phase 2:** Voice input, richer plan formatting (exercise cards), progress check-ins.
- **Phase 3:** Wearable integrations, weekly auto-generated programs, optional human coach hand-off.

---

## 6. Open Technical Questions

- Streaming transport: SSE vs. the Anthropic SDK's native streaming over a Route Handler — confirm during scaffolding.
- Profile fact extraction: rules/heuristics vs. a lightweight LLM extraction pass after each turn.
- Guest-to-account migration: how to carry an anonymous session's history into a new account.
- Rate limiting / cost controls: per-user message caps and context-trimming strategy.
