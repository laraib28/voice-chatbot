<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0  (initial ratification)
Bump rationale: MAJOR — first-time fill of all placeholders; establishes all governance principles from scratch.

Modified principles: N/A (initial creation)

Added sections:
  - Core Principles (I–VII)
  - Technical Standards
  - Development Workflow & Quality Gates
  - Governance

Removed sections: N/A

Templates reviewed:
  ✅ .specify/templates/plan-template.md   — Constitution Check section aligns; no updates required
  ✅ .specify/templates/spec-template.md   — Scope/requirements structure aligns; no updates required
  ✅ .specify/templates/tasks-template.md  — Phase/task structure aligns; no updates required
  ✅ .specify/templates/phr-template.prompt.md — No outdated references; aligns with SDD workflow

Deferred TODOs: None — all fields resolved from user-supplied project definition.
-->

# AI Learning Assistant Platform Constitution

## Core Principles

### I. Dynamic Content First (NON-NEGOTIABLE)

No course information, FAQ content, announcement text, or any other educational
data MAY be hardcoded inside prompts, frontend components, or agent logic.

All educational content MUST be retrieved dynamically from Supabase at runtime.
The AI assistant MUST reflect the current database state immediately after an
administrator saves changes — without redeployment or code modification.

**Rationale**: The platform's value is that a non-technical administrator can
manage courses and the AI surfaces them instantly. Hardcoded content destroys
this guarantee and couples business logic to code.

### II. Multilingual By Default (NON-NEGOTIABLE)

The assistant MUST automatically detect the user's language from their first
message and MUST continue responding in that same language throughout the session.

Supported behaviours:
- English input → English responses
- Urdu input → Urdu responses
- Roman Urdu input → Roman Urdu responses

Future languages MUST be addable without architectural changes.

**Rationale**: Target users include students, parents, and community members who
are more comfortable in Urdu or Roman Urdu. Forcing English degrades trust and
accessibility.

### III. Voice-First Experience

Every user-facing capability MUST be equally reachable via:
- Voice input (microphone)
- Voice output (text-to-speech)
- Text chat

No feature MAY be text-only or voice-only. The OpenAI Realtime API MUST be used
to power real-time voice interactions with sub-500 ms response latency.

**Rationale**: Voice lowers the barrier for users unfamiliar with typed interfaces,
including parents, beginners, and non-technical audiences.

### IV. Educational Guidance

The AI agent MUST be capable of:
1. Explaining available courses and their benefits.
2. Recommending personalised learning paths.
3. Answering FAQs stored in the database.
4. Guiding beginners who are unsure where to start.
5. Helping parents understand programme suitability for their children.
6. Assisting students in comparing and choosing courses.

The agent MUST NOT fabricate course details. All answers MUST be grounded in
current Supabase data. When information is unavailable, the agent MUST escalate
to a human administrator.

### V. Secure Lead Generation

The assistant MAY collect lead information — Name, Phone Number, Email, and
Interested Course — only after explicitly informing the user and receiving
consent.

All lead data MUST be stored in Supabase with Row Level Security enforced.
No lead data MAY be transmitted to third-party services without explicit
configuration.

**Rationale**: Collecting contact details without consent is a legal and trust risk.
Secure storage ensures leads are actionable only by authorised administrators.

### VI. Security & Zero Client Secrets

Every Supabase secret, OpenAI API key, and any other credential MUST be stored
in server-side environment variables. No secret MAY be exposed to the browser
or included in client bundles.

Mandatory controls:
- Row Level Security (RLS) MUST be enabled on every Supabase table.
- All user inputs MUST be validated server-side before database writes.
- Rate limiting MUST be applied to all public-facing API routes.
- Supabase Auth MUST be used for authentication (Email + Google OAuth).

### VII. Scalability Without Code Changes

The platform MUST support the addition of new courses, departments, batches,
instructors, FAQs, and announcements exclusively through Supabase data operations.

No application code change, environment variable update, or redeployment MAY be
required to onboard a new educational programme or cohort.

**Rationale**: The platform's long-term value is its ability to grow without
engineering involvement for routine content operations.

## Technical Standards

### Mandatory Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js (App Router) with TypeScript |
| UI components | Tailwind CSS + shadcn/ui |
| AI orchestration | OpenAI Agents SDK |
| Real-time voice | OpenAI Realtime API |
| Database & auth | Supabase PostgreSQL + Supabase Auth |
| Frontend deployment | Vercel |
| Backend functions | Serverless-compatible; Supabase Edge Functions where appropriate |

Deviations from this stack MUST be documented in an ADR and approved before
implementation begins.

### Data Model

Minimum required entities: Users, Courses, Course Batches, FAQs, Announcements,
Leads, Chat Sessions, Chat Messages, Settings.

Supabase PostgreSQL is the single source of truth. No other persistent store
MAY be introduced without an ADR.

### User Experience Standards

All interfaces MUST be:
- Mobile-first (responsive down to 375 px viewport)
- Accessible (WCAG 2.1 AA minimum)
- Fast (LCP < 2.5 s on a 4G connection)
- Beginner-friendly (no technical jargon in user-facing copy)

## Development Workflow & Quality Gates

### Constitution Check (mandatory gate per feature)

Before any implementation phase begins, the plan MUST verify:
- [ ] No hardcoded educational content (Principle I)
- [ ] Multilingual path exists for all user-facing strings (Principle II)
- [ ] Feature is accessible via both voice and text (Principle III)
- [ ] No secrets exposed to client bundles (Principle VI)
- [ ] New entities are addable via data operations only (Principle VII)

### Code Review Requirements

- Every PR MUST include a checklist confirming the above gates pass.
- RLS policies MUST be reviewed for every new or modified Supabase table.
- API routes MUST be reviewed for input validation and rate-limiting coverage.

### Testing Expectations

- Integration tests MUST cover the agent's dynamic content retrieval path.
- Lead collection flow MUST have end-to-end tests covering consent, storage, and RLS.
- Multilingual detection MUST be covered by automated tests for EN, UR, and Roman UR.

## Governance

This constitution supersedes all other practices, conventions, and prior agreements.
Any conflict between this document and a feature spec, plan, or implementation
decision MUST be resolved in favour of this constitution.

**Amendment procedure**:
1. Propose amendment with rationale in a PR against `.specify/memory/constitution.md`.
2. Increment `CONSTITUTION_VERSION` per semantic versioning policy below.
3. Update `LAST_AMENDED_DATE` to the date of merge.
4. Run the Sync Impact Report checklist and update all dependent templates.
5. Obtain at least one peer review before merging.

**Versioning policy**:
- MAJOR: Removal or redefinition of any non-negotiable principle.
- MINOR: New principle or section added; materially expanded guidance.
- PATCH: Clarifications, wording fixes, non-semantic refinements.

**Compliance**: All PRs and design reviews MUST verify compliance with this
constitution. Complexity beyond what a principle permits MUST be justified in
the plan's Complexity Tracking table and, where architecturally significant,
documented in an ADR under `history/adr/`.

**Runtime guidance**: See `CLAUDE.md` for agent-specific execution rules and
PHR/ADR workflow requirements.

**Version**: 1.0.0 | **Ratified**: 2026-06-02 | **Last Amended**: 2026-06-02
