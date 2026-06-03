# Research: AI Learning Assistant Platform

**Branch**: `001-ai-learning-assistant` | **Date**: 2026-06-02
**Phase**: 0 — Architecture decisions and integration patterns

---

## 1. OpenAI Realtime API — Voice Integration Pattern

**Decision**: Ephemeral token relay pattern (not full WebSocket proxy).

**How it works**:
1. Browser requests a short-lived ephemeral token from `POST /api/voice/session`
   (server-side Next.js API route, holds the OpenAI API key).
2. Server calls OpenAI's `/v1/realtime/sessions` endpoint with the desired model
   and voice configuration, receives a token valid for ~60 seconds.
3. Browser uses that token to open a direct WebRTC/WebSocket connection to
   OpenAI's Realtime API servers.
4. All audio transport bypasses the Next.js server — no relay latency.

**Why not full WebSocket proxy**:
- Proxying audio through Next.js adds 50–200 ms round-trip latency per audio
  chunk, violating the < 500 ms voice response target.
- Vercel serverless functions have a 60-second max execution limit — incompatible
  with long-running WebSocket sessions.
- Ephemeral tokens are scoped (single session, short expiry) — equivalent
  security posture to a proxy without the latency penalty.

**Alternatives considered**:
- Full WebSocket proxy through Next.js: rejected — latency and serverless limits.
- Dedicated WebSocket server (e.g., Railway, Fly.io): rejected — adds infra
  complexity that isn't needed for MVP; revisit post-launch if needed.

**References**: OpenAI Realtime API docs (2024), `@openai/realtime-api-beta` SDK.

---

## 2. AI Agent Grounding — Dynamic Content Retrieval

**Decision**: OpenAI Agents SDK with database tool calls at inference time.

**Tool set**:
```
get_courses()                    → returns all active courses + batches
get_course_details(course_id)    → returns full course + FAQ + batch details
get_faqs(course_id?)             → platform-wide or course-specific FAQs
get_announcements()              → active announcements
get_settings()                   → platform name, contact info, escalation email
save_lead(name, phone, email, course, session_id)
```

**Why not RAG / vector search**:
- Course catalogue for an institute is small (tens to low hundreds of records).
  Semantic search adds complexity without meaningful benefit at this scale.
- SQL queries against Supabase return structured, authoritative data with zero
  hallucination risk on factual fields (price, dates, capacity).
- RAG would require a vector index refresh pipeline — another moving part that
  contradicts the "scalability without code changes" principle for MVP.
- Revisit RAG when FAQ count exceeds ~500 entries or when unstructured document
  search is needed.

**Agent architecture**:
- Single agent with a system prompt that: (a) instructs language detection and
  response, (b) mandates tool use before answering course questions, (c) defines
  lead capture flow with consent gate, (d) defines escalation behaviour.
- No hardcoded course names or content in the system prompt.
- System prompt reads dynamic config (institute name, contact) from `get_settings()`.

---

## 3. Multilingual — Language Detection Approach

**Decision**: GPT-4o intrinsic language detection via system prompt instruction.
No external NLP service.

**System prompt instruction**:
```
Detect the user's language from their first message.
If the user writes in English, respond in English.
If the user writes in Urdu (any script), respond in Urdu.
If the user writes in Roman Urdu (Urdu written with Latin script), respond in Roman Urdu.
Maintain this language for the entire session.
```

**Why GPT-4o is sufficient**:
- GPT-4o achieves >99% accuracy on EN/UR/Roman UR detection in practice.
- Native trilingual response quality (Urdu and Roman Urdu) is production-grade.
- No additional API call, no latency overhead, no separate service to maintain.

**Voice (Realtime API)**:
- The Realtime API session is initialised with language-aware instructions in the
  session's system message. The model detects and maintains language automatically.
- TTS output language follows the LLM's response language (GPT-4o supports
  multilingual TTS natively).

**Limitations**:
- Roman Urdu is not a formally standardised orthography; the model handles common
  variants well but edge-case transliterations may vary.
- Non-EN/UR languages are best-effort; not part of acceptance criteria.

---

## 4. Admin Authentication — Supabase Auth + Next.js Middleware

**Decision**: Supabase Auth (Email + Google OAuth) with Next.js `middleware.ts`
enforcing session validation on all `/admin/*` routes.

**Flow**:
1. Admin navigates to `/admin` → middleware checks for valid Supabase session.
2. If no session → redirect to `/auth/login`.
3. Login page initiates Supabase Auth (email/password or Google OAuth).
4. Supabase Auth returns a JWT stored in a `httpOnly` cookie (set by the
   `@supabase/ssr` helper).
5. On subsequent requests, middleware reads the cookie, refreshes the token if
   near expiry, and injects the user into the server component context.
6. Admin-panel server components and API routes use the server-side Supabase
   client (service role) after verifying the session.

**RLS integration**:
- The `administrators` table maps `auth.users.id` → admin record.
- RLS `WITH CHECK` policies on write-protected tables verify
  `auth.uid() IN (SELECT id FROM administrators)`.

**Why not custom JWT / NextAuth**:
- Supabase Auth is already in the stack; no additional auth library needed.
- `@supabase/ssr` handles cookie management and token refresh automatically.
- Avoids split session state between Supabase and a secondary auth provider.

---

## 5. Row Level Security Strategy

**Decision**: Minimal-privilege RLS with three principal classes.

| Principal | Identity | Access |
|---|---|---|
| Anonymous visitor | `auth.uid() IS NULL` | SELECT on courses, faqs, announcements, settings; INSERT on leads, chat_sessions, chat_messages |
| Server-side agent | Service role key (bypasses RLS) | Full access — used only from server-side Next.js routes |
| Administrator | `auth.uid() IN (SELECT id FROM administrators)` | Full CRUD on all content tables; SELECT on leads |

**Key policy decisions**:
- `leads` table: anonymous INSERT allowed (chat agent writes via server route with
  service role — not directly from browser), admin SELECT only.
- `chat_sessions` and `chat_messages`: anonymous INSERT allowed (session tracking);
  no SELECT for anonymous users (privacy); admin SELECT for analytics.
- `courses`, `faqs`, `announcements`, `settings`: anonymous SELECT (active rows
  only); admin full CRUD.

**Why service role for agent tool calls**:
- The AI agent tools run inside Next.js API routes (server-side only).
- Using the service role key in server routes bypasses RLS intentionally — the
  route itself is the authorisation boundary (request validation + rate limiting).
- This avoids complex RLS conditions for the agent's read operations while keeping
  credentials off the client.

---

## 6. Voice Degradation — No Microphone Scenario

**Decision**: Client-side permission detection with automatic UI fallback.

**Implementation**:
- On page load, check `navigator.mediaDevices.getUserMedia` availability.
- If microphone permission is denied or unavailable, hide the voice toggle button
  and show a text-only interface.
- Voice button shows a permission-request flow on first click; if denied, it shows
  an informational tooltip and disables itself.
- All AI capabilities remain available in text mode.

---

## 7. Resolved: All Technical Context Items

| Item | Status | Resolution |
|---|---|---|
| Voice transport pattern | ✅ Resolved | Ephemeral token relay |
| AI grounding mechanism | ✅ Resolved | Agents SDK tool calls (no RAG for MVP) |
| Language detection | ✅ Resolved | GPT-4o intrinsic (system prompt instruction) |
| Admin auth | ✅ Resolved | Supabase Auth + Next.js middleware |
| RLS strategy | ✅ Resolved | Three-principal model (anon / service-role / admin) |
| Voice degradation | ✅ Resolved | Client-side permission detection + text fallback |
| Testing approach | ✅ Resolved | Playwright (E2E) + Vitest (unit agent tools) |
