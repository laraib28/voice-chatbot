---
description: "Task list for AI Learning Assistant Platform"
---

# Tasks: AI Learning Assistant Platform

**Input**: Design documents from `/specs/001-ai-learning-assistant/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: Not explicitly requested — test scaffolding included only for E2E validation steps in the Polish phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on in-progress tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Paths are relative to repository root

---

## Phase 1: Setup

**Purpose**: Initialize project scaffolding, tooling, and shared configuration.

- [x] T001 Initialize Next.js 14 project with TypeScript, App Router, Tailwind CSS, and shadcn/ui in repo root (`package.json`, `tsconfig.json`, `tailwind.config.ts`, `components.json`)
- [x] T002 Create `.env.example` with all required variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `NEXT_PUBLIC_APP_URL`
- [x] T003 [P] Install and configure Supabase CLI; create `supabase/config.toml` for local dev
- [x] T004 [P] Install OpenAI SDK dependencies: `openai`, `@openai/agents` in `package.json`
- [x] T005 [P] Configure Playwright in `playwright.config.ts` (base URL, browser targets) and Vitest in `vitest.config.ts`
- [x] T006 [P] Create `app/globals.css` with Tailwind base styles and `app/layout.tsx` root layout (metadata, font, body wrapper)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, RLS, auth infrastructure — MUST complete before any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Create `supabase/migrations/001_initial_schema.sql` — all 9 tables (`courses`, `course_batches`, `faqs`, `announcements`, `leads`, `chat_sessions`, `chat_messages`, `administrators`, `settings`) with triggers and `moddatetime` extension per data-model.md
- [x] T008 Create `supabase/migrations/002_rls_policies.sql` — all RLS policies per data-model.md (anon read, admin full-access, service-role bypass pattern)
- [x] T009 Create `supabase/migrations/003_seed_data.sql` — default `settings` rows (`institute_name`, `contact_email`, `contact_phone`, `operating_hours`, `escalation_message`) per data-model.md
- [x] T010 [P] Create `lib/supabase/client.ts` — browser Supabase client using `NEXT_PUBLIC_SUPABASE_ANON_KEY` only (never service role)
- [x] T011 [P] Create `lib/supabase/server.ts` — server-side Supabase client using `SUPABASE_SERVICE_ROLE_KEY` (server-only import guard)
- [x] T012 [P] Create `lib/supabase/middleware.ts` — session refresh helper using `@supabase/ssr`
- [x] T013 Create `middleware.ts` at repo root — protect all `/admin/*` and `/api/admin/*` routes; redirect unauthenticated users to `/auth/login`; return 401/403 for API routes
- [x] T014 Create `app/auth/login/page.tsx` — admin login page with email/password and Google OAuth sign-in buttons using Supabase Auth
- [x] T015 Create `app/auth/callback/route.ts` — Supabase Auth OAuth callback handler (exchanges code for session, redirects to `/admin`)

**Checkpoint**: Database schema live, RLS enforced, auth middleware active. User story work can now begin.

---

## Phase 3: User Story 1 — Real-Time AI Conversation (Priority: P1) 🎯 MVP

**Goal**: A visitor can open the platform and immediately chat (text or voice) with the AI. The AI answers using current Supabase data. No login required.

**Independent Test**: Open the app, type "What courses do you offer?", receive a live answer from the database within 10 seconds. Then click the microphone icon, ask the same question by voice, and receive a spoken response.

### Implementation for User Story 1 — Text Chat Agent

- [x] T016 [P] [US1] Create `lib/ai/tools.ts` — implement 6 Supabase tool functions: `getCourses()`, `getCourseDetails(courseId)`, `getFaqs(courseId?)`, `getAnnouncements()`, `getSettings()`, `saveLead(data)` using server-side Supabase client from `lib/supabase/server.ts`
- [x] T017 [P] [US1] Create `lib/ai/prompts.ts` — system prompt builder that calls `getSettings()` for institute name and escalation contact; NO hardcoded course names or FAQs in the prompt
- [x] T018 [US1] Create `lib/ai/agent.ts` — OpenAI Agents SDK agent definition: attach all 6 tools from T016, import system prompt from T017, configure model (`gpt-4o`) (depends on T016, T017)
- [x] T019 [US1] Create `app/api/chat/route.ts` — `POST /api/chat` handler: validate request (sessionId UUID, message ≤2000 chars), load last 20 messages from `chat_messages`, run agent, persist user + assistant messages to `chat_messages`, create `chat_sessions` row on first message, return `ChatResponse` per contracts/chat.md (depends on T018)

### Implementation for User Story 1 — Chat UI

- [x] T020 [P] [US1] Create `components/chat/MessageList.tsx` — renders conversation history; user messages right-aligned, assistant messages left-aligned; auto-scrolls to latest
- [x] T021 [P] [US1] Create `components/chat/MessageInput.tsx` — text input with send button; submits on Enter; disabled while awaiting response
- [x] T022 [P] [US1] Create `components/chat/LanguageIndicator.tsx` — small badge showing detected language (initially hidden; shown after first AI response)
- [x] T023 [US1] Create `components/chat/ChatInterface.tsx` — container: manages sessionId (generated client-side UUID), message history state, calls `POST /api/chat`, renders MessageList + MessageInput + LanguageIndicator (depends on T020, T021, T022)

### Implementation for User Story 1 — Voice

- [x] T024 [P] [US1] Create `app/api/voice/session/route.ts` — `POST /api/voice/session`: validate sessionId, call OpenAI `/v1/realtime/sessions` server-side with system instructions from `lib/ai/prompts.ts`, return ephemeral token + WebSocket URL per contracts/voice.md
- [x] T025 [P] [US1] Create `components/voice/VoiceButton.tsx` — microphone toggle button; checks `navigator.mediaDevices` availability on mount; hides itself if microphone unavailable; shows permission-request flow on first click
- [x] T026 [P] [US1] Create `components/voice/AudioVisualizer.tsx` — animated waveform shown during active voice session
- [x] T027 [P] [US1] Create `components/voice/VoiceSession.tsx` — manages WebSocket connection to OpenAI Realtime API using ephemeral token from T024; handles voice activity detection events; calls `/api/voice/session` to get token; exposes `onTranscript` callback for appending voice turns to chat history
- [x] T028 [US1] Update `components/chat/ChatInterface.tsx` — integrate VoiceButton and VoiceSession; toggle between text and voice modes; append voice transcripts to message history (depends on T023, T025, T027)

### Implementation for User Story 1 — Pages

- [x] T029 [US1] Create `app/(chat)/layout.tsx` — minimal public layout (no auth required)
- [x] T030 [US1] Create `app/(chat)/page.tsx` — renders ChatInterface; sets `<title>` from settings; mobile-first full-height layout (depends on T028)

**Checkpoint**: User Story 1 fully functional. Visitor can chat via text and voice. AI answers from live Supabase data.

---

## Phase 4: User Story 2 — Multilingual Interaction (Priority: P2)

**Goal**: The assistant auto-detects English, Urdu, or Roman Urdu from the user's first message and responds in the same language throughout the session — for both text and voice.

**Independent Test**: Start three separate sessions: one in English, one in Urdu, one in Roman Urdu. Verify each session receives all responses in the correct language without any language setting.

- [x] T031 [US2] Update `lib/ai/prompts.ts` — add trilingual detection block: "Detect language from first message. If English → respond in English. If Urdu → respond in Urdu. If Roman Urdu → respond in Roman Urdu. Maintain this language for all subsequent responses." (depends on T017)
- [x] T032 [US2] Create `lib/utils/language.ts` — `detectLanguage(text)` utility (heuristic: Arabic script → 'ur', Latin with Urdu words → 'roman_ur', else → 'en'); used to pre-populate `chat_sessions.detected_language` before first agent call
- [x] T033 [US2] Update `app/api/chat/route.ts` — on first message: call `detectLanguage()`, write `detected_language` to `chat_sessions`, pass language hint to agent context; return `detectedLanguage` in `ChatResponse` (depends on T019, T032)
- [x] T034 [US2] Update `app/api/voice/session/route.ts` — accept optional `language` hint in request body; include language instruction in Realtime API session system message (depends on T024)
- [x] T035 [US2] Update `components/chat/LanguageIndicator.tsx` — show language label after first AI response using `detectedLanguage` from API response (depends on T022, T033)

**Checkpoint**: US1 + US2 independently functional. All three languages confirmed in both text and voice sessions.

---

## Phase 5: User Story 3 — Course Discovery & Recommendations (Priority: P3)

**Goal**: The assistant asks clarifying questions (age, goals, background) before recommending courses, and explains why each recommendation fits the user.

**Independent Test**: Ask "I'm a beginner, what should I learn?" — verify the assistant asks at least one clarifying question before recommending, and explains the rationale for each recommendation.

- [x] T036 [US3] Update `lib/ai/prompts.ts` — add recommendation guidance block: when user is unguided, ask at least one clarifying question (age group, interest area, prior experience) before recommending; always explain rationale; present comparison when multiple courses match (depends on T031)
- [x] T037 [US3] Update `lib/ai/tools.ts` — verify `getCourses()` and `getCourseDetails()` return `target_audience` and `prerequisites` fields; add these to tool output schema so the agent can use them for matching (depends on T016)

**Checkpoint**: US1 + US2 + US3 functional. Guided recommendation flow confirmed.

---

## Phase 6: User Story 4 — Lead Capture (Priority: P4)

**Goal**: When a user expresses enrolment interest, the assistant asks for consent, collects Name/Phone/Email/Interested Course, accepts partial responses, and stores the lead immediately.

**Independent Test**: Express interest in a course, consent, provide name + email only (skip phone). Verify the lead appears in the admin leads list immediately with the two provided fields.

- [x] T038 [P] [US4] Create `lib/utils/validation.ts` — `validateEmail(email)` (regex), `sanitizePhone(phone)` (strip non-numeric), `validateLeadRequest(body)` (checks consent + at least one non-null field)
- [x] T039 [US4] Create `app/api/leads/route.ts` — `POST /api/leads` per contracts/leads.md: server-side validation via T038, reject if `consentGiven !== true` with 400, INSERT using service-role client, return 201 with lead ID (depends on T011, T038)
- [x] T040 [US4] Update `lib/ai/tools.ts` — implement `saveLead()` tool: calls `POST /api/leads` internally with session ID and collected fields; handles partial lead gracefully (depends on T016, T039)
- [x] T041 [US4] Update `lib/ai/prompts.ts` — add lead capture flow block: when user expresses enrolment interest, ask consent first; if granted, collect fields one at a time and confirm; if declined, continue conversation without repeating offer (depends on T036)

**Checkpoint**: US1–US4 functional. Lead consent flow confirmed. Partial leads stored correctly. Admin sees leads immediately.

---

## Phase 7: User Story 5 — Admin Content Management (Priority: P5)

**Goal**: A non-technical admin logs in and manages all educational content (courses, batches, FAQs, announcements, leads, settings). AI reflects changes within 5 minutes.

**Independent Test**: Log in as admin, create a new course, return to the chat and ask about it — it appears in the AI's response immediately without redeployment.

### Admin API Routes

- [x] T042 [P] [US5] Create `app/api/admin/courses/route.ts` — `GET` (all courses), `POST` (create course); auth guard checks admin session; validate `name` required on POST
- [x] T043 [P] [US5] Create `app/api/admin/courses/[id]/route.ts` — `PATCH` (update), `DELETE` (archives: sets `status = 'archived'`)
- [x] T044 [P] [US5] Create `app/api/admin/courses/[courseId]/batches/route.ts` — `GET` (batches for course), `POST` (create batch); validate `startDate`, `endDate` required
- [x] T045 [P] [US5] Create `app/api/admin/batches/[id]/route.ts` — `PATCH` (update batch), `DELETE` (hard delete)
- [x] T046 [P] [US5] Create `app/api/admin/faqs/route.ts` — `GET` (all FAQs, optional `?courseId`), `POST` (create FAQ); validate `question`, `answer` required
- [x] T047 [P] [US5] Create `app/api/admin/faqs/[id]/route.ts` — `PATCH`, `DELETE`
- [x] T048 [P] [US5] Create `app/api/admin/announcements/route.ts` — `GET`, `POST`; validate `title`, `body` required
- [x] T049 [P] [US5] Create `app/api/admin/announcements/[id]/route.ts` — `PATCH`, `DELETE`
- [x] T050 [P] [US5] Create `app/api/admin/leads/route.ts` — `GET` with pagination (`?limit`, `?offset`, `?from`, `?to`), sorted newest-first
- [x] T051 [P] [US5] Create `app/api/admin/leads/[id]/route.ts` — `DELETE` (permanent erasure per GDPR)
- [x] T052 [P] [US5] Create `app/api/admin/settings/route.ts` — `GET` (all settings), `PATCH` (update array of key/value pairs)

### Admin UI Components

- [x] T053 [P] [US5] Create `components/admin/CourseForm.tsx` — form for create/edit course (name, description, duration, target audience, prerequisites, pricing, status toggle)
- [x] T054 [P] [US5] Create `components/admin/BatchForm.tsx` — form for create/edit batch (start date, end date, capacity, location, status)
- [x] T055 [P] [US5] Create `components/admin/FaqForm.tsx` — form for create/edit FAQ (question, answer, course selector, order index, active toggle)
- [x] T056 [P] [US5] Create `components/admin/AnnouncementForm.tsx` — form for create/edit announcement (title, body, course selector, start/end dates, active toggle)
- [x] T057 [P] [US5] Create `components/admin/LeadsTable.tsx` — sortable table showing name, phone, email, interested course, timestamp; delete button per row

### Admin Pages

- [x] T058 [US5] Create `app/(admin)/layout.tsx` — admin shell: sidebar navigation (Courses, FAQs, Announcements, Leads, Settings), user info, sign-out button; wraps all admin pages (depends on T013, T014)
- [x] T059 [US5] Create `app/(admin)/page.tsx` — admin dashboard: redirect to `/admin/courses`
- [x] T060 [US5] Create `app/(admin)/courses/page.tsx` — course list with status badges; links to edit; archive action; "New Course" button (depends on T042, T053, T058)
- [x] T061 [US5] Create `app/(admin)/courses/new/page.tsx` — new course form page using CourseForm (depends on T042, T053)
- [x] T062 [US5] Create `app/(admin)/courses/[id]/page.tsx` — edit course page using CourseForm; includes batch list for this course (depends on T043, T044, T053, T054)
- [x] T063 [US5] Create `app/(admin)/faqs/page.tsx` — FAQ list with course filter; edit/delete inline; "New FAQ" button (depends on T046, T047, T055)
- [x] T064 [US5] Create `app/(admin)/announcements/page.tsx` — announcement list with active/expired badges; edit/delete; "New Announcement" button (depends on T048, T049, T056)
- [x] T065 [US5] Create `app/(admin)/leads/page.tsx` — leads table with date range filter and CSV export button; delete per row (depends on T050, T051, T057)

**Checkpoint**: All 5 user stories functional. Full platform working end-to-end.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Security hardening, UX refinement, observability, and validation coverage.

- [x] T066 [P] Add rate limiting to `app/api/chat/route.ts` (30 req/min per IP), `app/api/voice/session/route.ts` (10 req/min), `app/api/leads/route.ts` (5 req/min) using an in-memory or Upstash Redis store
- [x] T067 [P] Add server-side input validation to all `/api/admin/*` routes: required field checks, type coercion, `404` on unknown IDs, sanitize all string inputs
- [x] T068 [P] Add error boundaries (`components/ErrorBoundary.tsx`) and loading skeletons to `ChatInterface.tsx`, `MessageList.tsx`, and admin page components
- [x] T069 [P] Audit mobile responsiveness of chat UI and admin panel at 375 px viewport; fix any layout breaks in `app/(chat)/page.tsx` and `app/(admin)/layout.tsx`
- [x] T070 [P] Add WCAG 2.1 AA attributes: `aria-label` on voice button, `role="log"` on message list, keyboard navigation for admin forms
- [x] T071 Create `tests/e2e/chat-text.spec.ts` — Playwright: open app, send text message, verify response contains course data from DB
- [x] T072 Create `tests/e2e/multilingual.spec.ts` — Playwright: test EN / Urdu / Roman Urdu sessions; verify LanguageIndicator updates correctly
- [x] T073 Create `tests/e2e/lead-capture.spec.ts` — Playwright: express interest → consent → submit name + email only → verify lead in admin panel
- [x] T074 Create `tests/e2e/admin-panel.spec.ts` — Playwright: log in as admin, create course, navigate to chat, verify course appears in AI response
- [x] T075 Create `tests/unit/agent-tools.test.ts` — Vitest: mock Supabase client; test each tool function returns correct shape; test `saveLead` rejects missing consent
- [x] T076 Run `quickstart.md` validation end-to-end (fresh env, migrations, first admin, test all checkpoints)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Foundational — no dependency on other stories
- **US2 (Phase 4)**: Depends on US1 completion (updates agent + chat API) — sequential
- **US3 (Phase 5)**: Depends on US2 completion (updates same prompts file) — sequential
- **US4 (Phase 6)**: Depends on US3 completion (updates same prompts + tools files) — sequential
- **US5 (Phase 7)**: Depends on Foundational only — can run in parallel with US1–US4
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependency on other stories
- **US2 (P2)**: Must follow US1 (modifies same files: `prompts.ts`, `chat/route.ts`)
- **US3 (P3)**: Must follow US2 (modifies same file: `prompts.ts`)
- **US4 (P4)**: Must follow US3 (modifies same files: `prompts.ts`, `tools.ts`)
- **US5 (P5)**: Independent of US1–US4 after Foundational; can run in a parallel workstream

### Within Each Story

- Tools/prompts files before agent (T016, T017 → T018)
- Agent before API route (T018 → T019)
- Atomic UI components before container (T020–T022 → T023)
- Voice components in parallel, then integrate into ChatInterface (T024–T027 → T028)
- Admin API routes before admin pages (T042–T052 → T058–T065)

### Parallel Opportunities

- All tasks marked `[P]` within a phase can run simultaneously
- Phase 2 tasks T007–T009 (migrations) must be sequential; T010–T012 can run in parallel
- Phase 7 (US5) API routes T042–T052 are all fully parallel
- Phase 7 (US5) UI components T053–T057 are all fully parallel
- Phase 7 (US5) can run in a separate developer workstream from US1–US4 after Foundational

---

## Parallel Example: User Story 1

```bash
# Launch in parallel:
Task T016: Create lib/ai/tools.ts
Task T017: Create lib/ai/prompts.ts

# Then (depends on T016+T017):
Task T018: Create lib/ai/agent.ts

# Then (depends on T018):
Task T019: Create app/api/chat/route.ts

# Launch in parallel:
Task T020: Create components/chat/MessageList.tsx
Task T021: Create components/chat/MessageInput.tsx
Task T022: Create components/chat/LanguageIndicator.tsx
Task T024: Create app/api/voice/session/route.ts
Task T025: Create components/voice/VoiceButton.tsx
Task T026: Create components/voice/AudioVisualizer.tsx
Task T027: Create components/voice/VoiceSession.tsx
```

## Parallel Example: User Story 5

```bash
# Launch ALL admin API routes in parallel (T042–T052 — all independent files):
Task T042: app/api/admin/courses/route.ts
Task T043: app/api/admin/courses/[id]/route.ts
Task T044: app/api/admin/courses/[courseId]/batches/route.ts
...

# Launch ALL admin UI components in parallel (T053–T057):
Task T053: components/admin/CourseForm.tsx
Task T054: components/admin/BatchForm.tsx
...
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (database + auth — CRITICAL)
3. Complete Phase 3: US1 (text chat + voice)
4. **STOP and VALIDATE**: Test text chat with live Supabase data; test voice session
5. Deploy to Vercel + demo

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 → US1 ✅ → Deploy MVP (text + voice AI chat)
3. Phase 4 → US2 ✅ → Add multilingual support
4. Phase 5 → US3 ✅ → Add recommendations
5. Phase 6 → US4 ✅ → Add lead capture
6. Phase 7 → US5 ✅ → Add admin panel (can be developed in parallel earlier)
7. Phase 8 → Polish → Production-ready

### Parallel Team Strategy

With 2 developers:
- **Developer A**: Phase 1+2 together → then US1 → US2 → US3 → US4 (sequential)
- **Developer B**: Phase 1+2 together → then US5 admin panel (fully parallel with US1–US4)

---

## Notes

- `[P]` = different files, no incomplete task dependencies — safe to run simultaneously
- US1–US4 are intentionally sequential: each story modifies shared files (`prompts.ts`, `tools.ts`, `agent.ts`)
- US5 is independent and can be developed in parallel by a second developer
- Migrations (T007–T009) must be run in order (001 → 002 → 003)
- Never put `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` in `NEXT_PUBLIC_*` variables
- `lib/supabase/server.ts` must include a server-only guard to prevent accidental browser import
- Commit after each checkpoint validation, not after every task
