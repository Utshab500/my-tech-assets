# TASKS.md

Build plan for **Virtual Gym Coach**, organized into milestones. Companion to `PRD_GymCoachChat.md`, `PLANNING.md`, and `CLAUDE.md`. Check items off as completed; add new tasks under the relevant milestone as they surface.

---

## Milestone 0 — Project Setup

- [x] Initialize Next.js (App Router) + TypeScript project with strict mode
- [x] Configure ESLint + Prettier
- [x] Set up Tailwind CSS and wire design tokens (`--bg`, `--ink`, `--muted`, `--accent`, `--surface`) as CSS variables
- [x] Install and configure shadcn/ui + Radix
- [x] Add fonts (display: Fraunces/Inter Tight, body: Inter)
- [x] Set up Git repo, `.gitignore`, and branch conventions
- [x] Create `.env.example` with all expected variables
- [x] Set up local Postgres (Docker) and connect Prisma
- [x] Configure Vitest (unit) and Playwright (e2e) harnesses
- [x] Add `CLAUDE.md`, `PLANNING.md`, `PRD`, `TASKS.md` to repo root

## Milestone 1 — Data Layer & Auth

- [x] Define Prisma schema: User, Profile, Conversation, Message, Plan
- [x] Run initial migration
- [x] Set up Auth.js (NextAuth) with email sign-in
- [x] Add Google OAuth provider
- [x] Implement guest mode (anonymous session, one active conversation)
- [x] Build sign-in / sign-up UI in the minimalist style
- [x] Implement session handling and protected routes
- [x] Add data-deletion endpoint (delete user + conversations + plans)

## Milestone 2 — The Coach (AI Core)

- [x] Integrate Anthropic Claude SDK on the backend
- [x] Write the Coach system prompt: persona, voice, knowledge domains
- [x] Encode safety guardrails (not-a-doctor, no impersonation of real athletes, refuse extreme advice, ask clarifying questions)
- [x] Build system-prompt assembly that injects user profile + history
- [x] Implement streaming response endpoint (Route Handler, SSE)
- [x] Add context-trimming strategy for long conversations
- [x] Add timeout handling + retry logic
- [x] Write tests asserting guardrail behavior on edge-case prompts

## Milestone 3 — Chat Experience (Core UI)

- [x] Build app shell: centered conversation column (~720px), collapsible left rail, pinned input bar
- [x] Implement message list with distinct Coach vs. user styling
- [x] Wire streaming UI so tokens render progressively
- [x] Add markdown rendering (headings, lists, tables) via react-markdown + sanitize
- [x] Build input bar with send, loading, and disabled states
- [x] Add empty-state with suggested prompt chips ("Build me a 3-day plan", "Fix my squat", "Post-workout nutrition")
- [x] Implement copy-message action
- [x] Add subtle motion (fades, smooth streaming) — nothing decorative
- [x] Mobile-responsive pass on the full chat flow

## Milestone 4 — Onboarding & Personalization

- [x] Build optional 3-step onboarding (goal, experience level, training environment)
- [x] Make onboarding fully skippable; allow chatting without it
- [x] Persist onboarding answers to Profile
- [x] Implement profile fact extraction (capture key facts surfaced in chat)
- [x] Inject profile into Coach context each turn
- [x] Verify "memory" works across sessions

## Milestone 5 — History & Saved Plans

- [ ] Persist conversation history per user
- [ ] Build history list in the left rail with session titles
- [ ] Auto-generate conversation titles
- [ ] Allow resuming a past conversation
- [ ] Implement "Save as Plan" from any Coach message
- [ ] Build Saved Plans view (list + detail)
- [ ] Add copy/view actions on plans
- [ ] Handle guest-to-account history migration

## Milestone 6 — Quality, Accessibility & Performance

- [ ] Accessibility audit to WCAG 2.1 AA (keyboard nav, contrast, screen-reader labels)
- [ ] Verify first token streams in under ~2s; optimize as needed
- [ ] Add per-user rate limiting / message caps
- [ ] Ensure conversations are encrypted at rest
- [ ] Add error states and empty states throughout
- [ ] Cross-browser + cross-device QA
- [ ] Unit + e2e test coverage on critical flows (chat, auth, save plan)

## Milestone 7 — Launch Prep

- [ ] Set up Vercel project + managed Postgres (Neon/Supabase)
- [ ] Configure production env vars and secrets
- [ ] Add analytics for success metrics (activation, retention, messages/user, saved plans)
- [ ] Add in-app satisfaction prompt (≥4.3/5 target)
- [ ] Write privacy policy + terms (incl. not-medical-advice disclaimer)
- [ ] Final design review against minimalist principles
- [ ] Smoke test full user journey in production
- [ ] Launch

---

## Backlog (Post-MVP — Phases 2 & 3)

- [ ] Voice input
- [ ] Richer plan formatting (exercise cards)
- [ ] Progress check-ins between sessions
- [ ] Wearable integrations (Apple Health, Garmin)
- [ ] Weekly auto-generated programs
- [ ] Optional human coach hand-off
- [ ] Proactive check-ins (notifications/email) — pending product decision
- [ ] Multiple coach specialties vs. unified coach — pending product decision
- [ ] Monetization model (freemium caps vs. subscription) — pending product decision
