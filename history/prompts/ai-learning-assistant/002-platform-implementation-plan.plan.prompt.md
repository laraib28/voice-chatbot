---
id: "002"
title: Platform Implementation Plan
stage: plan
date: 2026-06-02
surface: agent
model: claude-sonnet-4-6
feature: ai-learning-assistant
branch: 001-ai-learning-assistant
user: laraib-adnan
command: /sp.plan
labels: ["plan","architecture","nextjs","supabase","openai","realtime-api","voice","multilingual","admin-panel"]
links:
  spec: specs/001-ai-learning-assistant/spec.md
  ticket: null
  adr: history/adr/ADR-001-frontend-deployment-stack.md
  pr: null
files:
  - specs/001-ai-learning-assistant/plan.md
  - specs/001-ai-learning-assistant/research.md
  - specs/001-ai-learning-assistant/data-model.md
  - specs/001-ai-learning-assistant/quickstart.md
  - specs/001-ai-learning-assistant/contracts/chat.md
  - specs/001-ai-learning-assistant/contracts/voice.md
  - specs/001-ai-learning-assistant/contracts/leads.md
  - specs/001-ai-learning-assistant/contracts/admin.md
tests:
  - null
---

## Prompt

AI Learning Assistant Platform — voice chat agent, admin panel, lead generation,
Supabase backend, Next.js frontend, OpenAI Realtime API, Vercel deployment

## Response snapshot

All Phase 0 and Phase 1 plan artifacts generated for `001-ai-learning-assistant`.

**Constitution Check**: All 5 gates pass (pre-Phase 0 and post-Phase 1).

**Phase 0 — research.md**: 7 research areas resolved:
1. Voice transport → ephemeral token relay (browser connects direct to OpenAI, no WebSocket proxy)
2. AI grounding → Agents SDK tool calls at inference time (no RAG for MVP)
3. Language detection → GPT-4o intrinsic via system prompt (no external NLP service)
4. Admin auth → Supabase Auth + Next.js middleware.ts
5. RLS strategy → 3-principal model: anon (read-only public), service-role (agent tools), admin (full CRUD)
6. Voice degradation → client-side permission detection, graceful text fallback
7. Testing → Playwright (E2E) + Vitest (unit)

**Phase 1 — data-model.md**: 9 tables defined with full SQL DDL, RLS policies,
triggers, indexes, and state transition diagrams. Migration order: schema → RLS → seed.

**Phase 1 — contracts/**: 4 contract files:
- chat.md: POST /api/chat (AI agent text, rate-limited, session-aware)
- voice.md: POST /api/voice/session (ephemeral token relay)
- leads.md: POST /api/leads (consent-gated, partial submissions)
- admin.md: Full CRUD for courses, batches, FAQs, announcements, leads, settings

**Phase 1 — quickstart.md**: Local dev setup (env vars, Supabase migrations,
first admin creation, verification steps, deployment guide).

**Phase 1 — project structure**: Web app pattern — Next.js App Router at root,
`app/(chat)`, `app/(admin)`, `app/api/`, `components/`, `lib/`, `supabase/migrations/`, `tests/`.

Agent context (CLAUDE.md) updated with TypeScript + Next.js 14 + Supabase stack.

## Outcome

- ✅ Impact: Full implementation plan generated; ready for /sp.tasks
- 🧪 Tests: Test strategy defined (Playwright E2E + Vitest unit); no tests written yet
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/chat.md, contracts/voice.md, contracts/leads.md, contracts/admin.md
- 🔁 Next prompts: /sp.tasks to generate task list
- 🧠 Reflection: Ephemeral token relay pattern is critical architectural decision — it satisfies both the < 500 ms voice latency requirement and the Zero Client Secrets principle simultaneously.

## Evaluation notes (flywheel)

- Failure modes observed: None — all context available from constitution + spec + ADRs
- Graders run and results (PASS/FAIL): Constitution Check (pre + post) — all 5 gates PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): /sp.tasks to validate task decomposition against the 5 user stories
