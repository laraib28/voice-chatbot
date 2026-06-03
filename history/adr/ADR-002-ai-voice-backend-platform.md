# ADR-002: AI Voice Engine & Backend Platform

> **Scope**: Document decision clusters, not individual technology choices. Group related decisions that work together.

- **Status:** Accepted
- **Date:** 2026-06-02
- **Feature:** Platform-wide (all features)
- **Context:**
  The platform's core value is an AI assistant that answers questions in real time
  using voice and text, retrieves current course data from a database, supports
  multilingual responses (EN / Urdu / Roman Urdu), and collects leads. This requires:
  (a) an AI orchestration layer capable of tool-calling and database lookups,
  (b) a real-time voice transport layer with sub-500 ms response latency,
  (c) a managed PostgreSQL database with row-level security and built-in auth,
  (d) a serverless compute layer close to the database to avoid cold-start-induced
  latency on AI agent tool calls.
  These four concerns are treated as a single cluster because the AI agent, voice
  API, database, and edge functions are all provided by two vendors (OpenAI and
  Supabase) and evolve together.

## Decision

All AI, voice, and backend concerns are handled by the following integrated cluster:

- **AI Orchestration**: OpenAI Agents SDK (tool-calling, multi-agent handoffs,
  guardrails, structured output)
- **Real-time Voice**: OpenAI Realtime API (WebSocket-based bidirectional audio;
  VAD, transcription, and TTS in one session)
- **Database**: Supabase PostgreSQL (managed Postgres; RLS; real-time subscriptions)
- **Authentication**: Supabase Auth (Email + Google OAuth; JWT; RLS integration)
- **Serverless Compute**: Supabase Edge Functions (Deno-based; deployed close to
  Supabase Postgres; used for agent tool endpoints and lead-storage handlers)

## Consequences

### Positive

- **Unified AI session**: The OpenAI Realtime API handles VAD (voice activity
  detection), transcription, LLM inference, and TTS in a single WebSocket session,
  eliminating the round-trip latency of chaining separate STT → LLM → TTS services.
- **Tool-call grounding**: The Agents SDK natively supports tool-calling, enabling
  the AI to query Supabase at inference time and return current course data — directly
  satisfying the Dynamic Content First principle.
- **Multilingual out of the box**: GPT-4o (the model backing Realtime API) handles
  EN/Urdu/Roman Urdu without additional translation infrastructure.
- **RLS as security boundary**: Supabase RLS policies enforce data access rules at
  the database level, independent of application code — satisfying Principle VI.
- **Admin dashboard included**: Supabase Studio provides a non-technical admin UI
  for managing course data and leads without building a custom CMS.
- **Tight RLS + Auth integration**: Supabase Auth JWTs are automatically respected
  by RLS policies, meaning access rules require no custom middleware.
- **Edge proximity**: Edge Functions run in Supabase's infrastructure close to
  Postgres, minimising agent tool-call latency.

### Negative

- **Dual vendor dependency**: OpenAI and Supabase are both critical. OpenAI pricing
  changes or Realtime API deprecation would require significant rework of the voice layer.
- **Realtime API is relatively new**: The OpenAI Realtime API launched in 2024;
  the ecosystem is less mature than traditional STT/TTS pipelines. Edge cases in
  multilingual voice output may surface.
- **Deno runtime friction**: Supabase Edge Functions use Deno, which differs from
  the Node.js ecosystem most developers expect. Some npm packages are unavailable or
  require `npm:` specifiers.
- **Supabase self-hosting complexity**: If cost scaling or compliance requires moving
  off Supabase Cloud, self-hosting Supabase adds significant operational overhead.
- **OpenAI Agents SDK lock-in**: The Agents SDK abstracts over raw OpenAI API calls;
  switching to a different model provider (Anthropic, Google) would require replacing
  the orchestration layer.
- **Realtime API cost**: Per-session audio billing is higher than text-only LLM
  usage; high concurrent voice sessions could drive up API costs unpredictably.

## Alternatives Considered

### Alternative A: LangChain + Pinecone + Firebase + LiveKit (voice)
- LangChain is a popular agent framework supporting multiple LLM providers.
- Pinecone adds vector search for semantic FAQ retrieval.
- Firebase provides auth and real-time database.
- LiveKit handles WebRTC voice sessions.
- **Rejected because**: Four separate vendors increases operational complexity and
  integration surface. OpenAI Agents SDK + Realtime API collapses AI orchestration
  and voice transport into two vendors (one for AI, one for data). Supabase's native
  PostgreSQL also enables SQL-based reporting without an additional vector DB for
  the initial MVP.

### Alternative B: Anthropic Claude API + Supabase + Twilio Voice
- Claude API (Anthropic) for LLM inference.
- Twilio for voice/telephony integration.
- **Rejected because**: Twilio is telephony-oriented and adds PSTN complexity
  not needed for a web-first voice experience. The OpenAI Realtime API provides
  browser-native WebSocket audio, which is a better fit for the platform's
  mobile-first web interface.

### Alternative C: AWS Bedrock + DynamoDB + Amazon Lex
- Fully managed AI and data services on AWS.
- **Rejected because**: DynamoDB's NoSQL model is a poor fit for relational course
  and user data. Lex has limited multilingual support for Urdu. Setup and IAM
  complexity significantly exceeds the Supabase/OpenAI path for a small team.

### Alternative D: Separate STT + LLM + TTS pipeline
- Use Whisper (STT) → GPT-4o (LLM) → ElevenLabs (TTS) as discrete services.
- **Rejected because**: Three-hop latency would likely exceed 500 ms for voice
  responses, violating the Voice-First Experience principle. The OpenAI Realtime API
  achieves sub-200 ms in practice by keeping all three steps in a single session.

## References

- Feature Spec: N/A (platform-level decision, pre-dates first feature spec)
- Implementation Plan: N/A (pre-dates first feature plan)
- Constitution: `.specify/memory/constitution.md` v1.0.0 (Principles I–VII,
  Technical Standards section)
- Related ADRs: ADR-001 (Frontend & Deployment Stack)
- Evaluator Evidence: `history/prompts/constitution/001-initial-constitution-ratification.constitution.prompt.md`
