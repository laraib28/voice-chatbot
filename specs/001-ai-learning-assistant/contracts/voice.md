# Contract: Voice Session Token API

**Route**: `POST /api/voice/session`
**Auth**: None (public — unauthenticated visitors)
**Rate limit**: 10 requests / minute per IP (token creation is expensive)

---

## Purpose

Creates a short-lived ephemeral token that the browser uses to open a direct
WebRTC/WebSocket connection to the OpenAI Realtime API. The OpenAI API key
never leaves the server.

---

## Request

```typescript
interface VoiceSessionRequest {
  sessionId: string;   // UUID — must match an existing or new chat_sessions row
  language?: 'en' | 'ur' | 'roman_ur'; // Detected language hint (from prior text exchange if any)
}
```

---

## Response (success — 200)

```typescript
interface VoiceSessionResponse {
  ephemeralToken: string;      // Short-lived token for direct OpenAI Realtime API connection
  expiresAt: string;           // ISO-8601 timestamp (~60 seconds from now)
  realtimeUrl: string;         // WebSocket URL the client should connect to
  sessionConfig: {
    model: string;             // e.g. "gpt-4o-realtime-preview"
    voice: string;             // e.g. "alloy"
    instructions: string;      // System prompt (language + tool use instructions)
  };
}
```

**Security note**: The `ephemeralToken` is scoped to a single Realtime session and
expires in ~60 seconds. Exposure to a third party allows one voice session at most.

---

## Response (error)

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `INVALID_REQUEST` | Missing/invalid sessionId |
| 429 | `RATE_LIMITED` | Exceeds 10 req/min |
| 500 | `TOKEN_CREATION_FAILED` | OpenAI API error |

---

## Behaviour

1. Validate `sessionId` (UUID format).
2. Call `POST https://api.openai.com/v1/realtime/sessions` server-side with:
   - Model: `gpt-4o-realtime-preview`
   - Voice: configurable via `settings` table
   - System instructions: language detection + tool use mandate
3. Return ephemeral token + WebSocket URL to the browser.
4. Browser opens a WebSocket to `realtimeUrl` using the ephemeral token.
5. All subsequent audio transport is direct browser ↔ OpenAI (no server relay).

---

## Voice Tool Calls

The Realtime API session is configured with the same tools as the text chat agent.
When the model needs course data during a voice interaction, it calls the tools
via a server-sent function-call mechanism built into the Realtime API protocol.

The tool implementations run server-side (in Supabase or a Next.js API handler
called by the Realtime API function-call callback). This design is identical to
the text chat tool-call pattern.

---

## Graceful Degradation

If the browser cannot obtain microphone permission, the client MUST NOT call this
endpoint. The voice button is hidden and the UI falls back to the text chat
interface transparently.

If this endpoint returns an error, the client MUST display a user-friendly message
("Voice is temporarily unavailable. Please use text chat.") and not expose the
error code.
