---
id: "003"
title: Platform Task Generation
stage: tasks
date: 2026-06-02
surface: agent
model: claude-sonnet-4-6
feature: ai-learning-assistant
branch: 001-ai-learning-assistant
user: laraib-adnan
command: /sp.tasks
labels: ["tasks","implementation","nextjs","supabase","openai","voice","admin-panel","lead-capture"]
links:
  spec: specs/001-ai-learning-assistant/spec.md
  ticket: null
  adr: history/adr/ADR-001-frontend-deployment-stack.md
  pr: null
files:
  - specs/001-ai-learning-assistant/tasks.md
tests:
  - null
---

## Prompt

/sp.tasks (no additional arguments — uses active feature branch 001-ai-learning-assistant)

## Response snapshot

76 tasks generated across 8 phases for `001-ai-learning-assistant`.

**Phase breakdown**:
- Phase 1 Setup: T001–T006 (6 tasks) — Next.js init, env, Supabase CLI, OpenAI deps, Playwright/Vitest, root layout
- Phase 2 Foundational: T007–T015 (9 tasks) — 3 DB migrations, 3 Supabase clients, middleware, login page, OAuth callback
- Phase 3 US1 (P1): T016–T030 (15 tasks) — agent tools, prompts, Agents SDK agent, chat API route, chat UI components, voice session token route, voice components
- Phase 4 US2 (P2): T031–T035 (5 tasks) — trilingual detection in prompts, language utility, chat API update, voice session update, LanguageIndicator update
- Phase 5 US3 (P3): T036–T037 (2 tasks) — recommendation guidance in prompts, tools schema enhancement
- Phase 6 US4 (P4): T038–T041 (4 tasks) — validation utils, leads API route, saveLead tool, consent flow in prompts
- Phase 7 US5 (P5): T042–T065 (24 tasks) — 11 admin API routes + 5 admin UI components + 8 admin pages
- Phase 8 Polish: T066–T076 (11 tasks) — rate limiting, validation, error boundaries, mobile audit, WCAG, E2E tests, unit tests

**Key parallelisation**: US5 (admin panel) is fully independent of US1–US4 and can be developed in a parallel workstream. Within US5, all 11 API routes (T042–T052) and all 5 components (T053–T057) are fully parallel.

**MVP scope**: Complete Phases 1–2 + Phase 3 (US1) only → deployable text+voice AI chat.

## Outcome

- ✅ Impact: 76 implementation-ready tasks; every task has an exact file path and story label
- 🧪 Tests: E2E (T071–T074) and unit (T075) test tasks in Polish phase
- 📁 Files: specs/001-ai-learning-assistant/tasks.md
- 🔁 Next prompts: /sp.implement to begin executing tasks
- 🧠 Reflection: US2–US4 are sequential (they all modify shared files: prompts.ts, tools.ts, agent.ts). US5 is the only story that's fully independent — extracting it to a parallel workstream is the highest-leverage team split for this project.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Format validation — all 76 tasks have checkbox + ID + description with file path; story labels on all US phases; PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): /sp.implement starting with Phase 1 Setup
