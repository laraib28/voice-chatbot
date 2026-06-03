# Contract: Lead Capture API

**Route**: `POST /api/leads`
**Auth**: None (public — triggered by AI agent tool call, server-side only)
**Rate limit**: 5 requests / minute per IP

---

## Purpose

Stores a lead record when a user has given consent and provided contact details
during a chat session. This route is called from the server-side agent tool
`save_lead`, not directly from the browser.

---

## Request

```typescript
interface LeadRequest {
  sessionId: string;          // UUID of the originating chat session
  name?: string;              // User's full name (optional per FR-018)
  phone?: string;             // Phone number (optional)
  email?: string;             // Email address (optional)
  interestedCourse?: string;  // Course name as free text (optional)
  consentGiven: boolean;      // MUST be true; request rejected if false
}
```

**Validation**:
- `consentGiven` MUST be `true` — reject with 400 if false (consent is the
  precondition for this endpoint being called at all).
- At least one of `name`, `phone`, `email`, `interestedCourse` MUST be non-null
  (otherwise the lead is empty and meaningless).
- `email`: if provided, MUST match a valid email regex.
- `phone`: if provided, stripped of non-numeric characters before storage;
  no format enforcement (international numbers vary).
- `sessionId`: valid UUID v4.

---

## Response (success — 201)

```typescript
interface LeadResponse {
  id: string;          // UUID of the created lead record
  createdAt: string;   // ISO-8601 timestamp
}
```

---

## Response (error)

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `INVALID_REQUEST` | Missing required fields or invalid format |
| 400 | `CONSENT_REQUIRED` | `consentGiven` is false |
| 400 | `EMPTY_LEAD` | All contact fields are null |
| 429 | `RATE_LIMITED` | Exceeds 5 req/min |
| 500 | `STORAGE_ERROR` | Supabase write failure |

---

## Behaviour

1. Validate all fields server-side.
2. Insert lead record using service role client (bypasses RLS — server is trusted).
3. Associate with `sessionId` for analytics.
4. Return 201 with lead ID.

**No email sending**: Lead follow-up is out of scope for the initial release.
The route only persists the record.

**Duplicate handling**: Multiple leads from the same session are allowed (user
may update details). No deduplication is performed server-side.
