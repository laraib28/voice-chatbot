# Contract: Text Chat API

**Route**: `POST /api/chat`
**Auth**: None (public — unauthenticated visitors)
**Rate limit**: 30 requests / minute per IP

---

## Purpose

Accepts a user message and returns the AI assistant's response.
The AI agent uses Supabase tool calls to retrieve current course data before
responding. All course content is dynamic — never returned from a cache or
hardcoded in the route.

---

## Request

```typescript
interface ChatRequest {
  message: string;           // User's message text (1–2000 chars)
  sessionId: string;         // UUID — caller creates on first message and reuses
  language?: 'en' | 'ur' | 'roman_ur'; // Optional hint; agent auto-detects if omitted
}
```

**Validation**:
- `message`: required, non-empty, max 2000 characters
- `sessionId`: required, valid UUID v4 format
- `language`: optional enum; ignored if not one of the three supported values

---

## Response (success — 200)

```typescript
interface ChatResponse {
  reply: string;             // Assistant's response text
  detectedLanguage: 'en' | 'ur' | 'roman_ur';
  sessionId: string;         // Echo of the request sessionId
  leadCaptureSuggested?: boolean; // true if agent signalled lead capture intent
}
```

---

## Response (error)

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `INVALID_REQUEST` | Missing/invalid fields |
| 429 | `RATE_LIMITED` | Exceeds 30 req/min |
| 500 | `AGENT_ERROR` | OpenAI API failure |
| 503 | `SERVICE_UNAVAILABLE` | Supabase connection failure |

```typescript
interface ErrorResponse {
  error: string;   // Machine-readable code
  message: string; // Human-readable description
}
```

---

## Behaviour

1. Validate request body.
2. Load chat history for `sessionId` from `chat_messages` (last 20 messages).
3. Call OpenAI Agents SDK with:
   - System prompt (language instruction + tool use mandate — no hardcoded course data)
   - Conversation history
   - Available tools: `get_courses`, `get_course_details`, `get_faqs`,
     `get_announcements`, `get_settings`, `save_lead`
4. Agent performs tool calls as needed to answer the question.
5. Persist user message + assistant reply to `chat_messages`.
6. Return `ChatResponse`.

**Session lifecycle**: The caller is responsible for generating and persisting
the `sessionId` (client-side UUID). The server creates a `chat_sessions` row
on first message if the ID is not already known.

---

## Example

```json
POST /api/chat
{
  "message": "Mujhe Python course ke baare mein batao",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}

200 OK
{
  "reply": "Python course 8 hafte ka hai aur beginners ke liye hai...",
  "detectedLanguage": "roman_ur",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```
