---
id: "001"
title: Initial Constitution Ratification
stage: constitution
date: 2026-06-02
surface: agent
model: claude-sonnet-4-6
feature: none
branch: master
user: laraib-adnan
command: /sp.constitution
labels: ["constitution","governance","initial-setup","multilingual","voice","ai-education"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
  - history/prompts/constitution/001-initial-constitution-ratification.constitution.prompt.md
tests:
  - null
---

## Prompt

Project Name: AI Learning Assistant Platform

Mission: Build a production-ready multilingual AI-powered Voice and Chat Assistant
platform for educational institutes, summer camps, workshops, bootcamps, and
regular IT courses.

The platform must allow administrators to manage courses dynamically while the AI
assistant automatically answers questions using the latest information stored in
the system.

Core Philosophy:
- The platform is NOT a Summer Camp application.
- It is an Educational AI Assistant that can support any current or future course
  without code modifications.
- All educational content must be managed through Supabase and surfaced dynamically
  through AI agents.

Non-Negotiable Principles:
1. Dynamic Content First — no hardcoded course data in prompts, frontend, or agents.
2. Multilingual By Default — auto-detect and respond in EN / UR / Roman Urdu.
3. Voice First Experience — voice input, voice output, text chat all equally capable.
4. Educational Guidance — explain courses, recommend paths, answer FAQs, assist parents.
5. Lead Generation — collect Name/Phone/Email/Course with consent; store in Supabase.

Technical Standards: Next.js + TypeScript + App Router + Tailwind CSS + shadcn/ui;
OpenAI Agents SDK + OpenAI Realtime API; Supabase PostgreSQL + Supabase Auth;
Vercel (frontend); Serverless/Edge Functions (backend).

Security: RLS on all tables, input validation, secure env vars, rate limiting.
No secrets exposed to client.

Scalability: new courses/batches/announcements via data ops only — no code changes.

## Response snapshot

Constitution written to `.specify/memory/constitution.md` at version 1.0.0.

Seven core principles defined (I–VII): Dynamic Content First, Multilingual By
Default, Voice-First Experience, Educational Guidance, Secure Lead Generation,
Security & Zero Client Secrets, Scalability Without Code Changes.

Technical Standards section mandates the full stack (Next.js, OpenAI, Supabase,
Vercel). Development Workflow section adds a per-feature Constitution Check gate
with five mandatory checkboxes. Governance section defines amendment procedure,
semantic versioning policy, and compliance expectations.

All four dependent templates reviewed — no updates required for initial ratification.
Sync Impact Report prepended as HTML comment in the constitution file.

## Outcome

- ✅ Impact: Constitution v1.0.0 ratified; all seven principles recorded and governance established.
- 🧪 Tests: No automated tests at this stage; Constitution Check gate defined for future features.
- 📁 Files: .specify/memory/constitution.md (overwritten with full content)
- 🔁 Next prompts: /sp.specify to create first feature spec; /sp.adr if stack choices require ADR documentation.
- 🧠 Reflection: User provided complete project definition upfront, enabling full constitution ratification in one pass with no deferred TODOs.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): manual review — PASS (no unresolved placeholders, dates ISO, principles declarative)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): add ADR for OpenAI Realtime API + Supabase stack choice
