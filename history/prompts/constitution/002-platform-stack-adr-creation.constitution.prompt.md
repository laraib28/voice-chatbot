---
id: "002"
title: Platform Stack ADR Creation
stage: constitution
date: 2026-06-02
surface: agent
model: claude-sonnet-4-6
feature: none
branch: master
user: laraib-adnan
command: /sp.adr ai-platform-stack-selection
labels: ["adr","architecture","stack-selection","openai","supabase","nextjs","voice"]
links:
  spec: null
  ticket: null
  adr: history/adr/ADR-001-frontend-deployment-stack.md
  pr: null
files:
  - history/adr/ADR-001-frontend-deployment-stack.md
  - history/adr/ADR-002-ai-voice-backend-platform.md
  - history/prompts/constitution/002-platform-stack-adr-creation.constitution.prompt.md
tests:
  - null
---

## Prompt

/sp.adr ai-platform-stack-selection

(Invoked after constitution ratification to document the platform stack selection
as an Architecture Decision Record.)

## Response snapshot

Two clustered ADRs created covering the full platform stack:

**ADR-001: Frontend & Deployment Stack**
Decision cluster: Next.js 14+ (App Router) + TypeScript + Tailwind CSS v3 +
shadcn/ui + Vercel. Status: Accepted. Three alternatives rejected: Remix/Fly.io,
Vite SPA/Netlify, CRA/MUI.

**ADR-002: AI Voice Engine & Backend Platform**
Decision cluster: OpenAI Agents SDK + OpenAI Realtime API + Supabase PostgreSQL +
Supabase Auth + Supabase Edge Functions. Status: Accepted. Four alternatives
rejected: LangChain/Pinecone/Firebase/LiveKit, Anthropic+Twilio, AWS Bedrock,
separate STT+LLM+TTS pipeline.

No plan.md existed at time of invocation (platform-level, pre-feature). Constitution
used as primary context source. ADR directory created at history/adr/.

## Outcome

- ✅ Impact: Two platform-level ADRs ratified; architectural decisions recorded before first feature spec begins.
- 🧪 Tests: N/A (architecture documentation task)
- 📁 Files: history/adr/ADR-001-frontend-deployment-stack.md, history/adr/ADR-002-ai-voice-backend-platform.md
- 🔁 Next prompts: /sp.specify to create first feature spec
- 🧠 Reflection: Clustering into two ADRs (frontend vs AI+backend) correctly mirrors the likely divergence points — the frontend stack could be replaced independently of OpenAI/Supabase, and vice versa.

## Evaluation notes (flywheel)

- Failure modes observed: No plan.md available (pre-feature); handled gracefully using constitution as context
- Graders run and results (PASS/FAIL): Significance test — both ADRs PASS all three criteria (impact, alternatives, scope)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add cost estimation section to ADR-002 for OpenAI Realtime API billing impact
