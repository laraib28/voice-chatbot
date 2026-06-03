# Contract: Admin Panel API

**Base path**: `/api/admin`
**Auth**: Required — valid Supabase session cookie (set by Supabase Auth)
**All routes return 401 if unauthenticated; 403 if authenticated but not admin.**

---

## Authentication Flow

Admin routes are protected by Next.js `middleware.ts`:
1. Middleware reads the Supabase session cookie on every request to `/admin/*` and `/api/admin/*`.
2. If no valid session → 401 (API) or redirect to `/auth/login` (page).
3. Middleware verifies the user's `auth.uid()` exists in the `administrators` table.
4. If not an administrator → 403.

---

## Courses

### `GET /api/admin/courses`
Returns all courses (any status, for admin visibility).

**Response 200**:
```typescript
{ courses: Course[] }

interface Course {
  id: string;
  name: string;
  description: string | null;
  duration: string | null;
  targetAudience: string | null;
  prerequisites: string | null;
  pricing: number | null;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}
```

### `POST /api/admin/courses`
Creates a new course.

**Request**:
```typescript
{ name: string; description?: string; duration?: string;
  targetAudience?: string; prerequisites?: string;
  pricing?: number; status?: 'active' | 'archived' }
```
- `name`: required, non-empty

**Response 201**: `{ course: Course }`

### `PATCH /api/admin/courses/:id`
Updates a course.

**Request**: Any subset of Course fields (except `id`, `createdAt`).

**Response 200**: `{ course: Course }`

### `DELETE /api/admin/courses/:id`
Archives a course (sets `status = 'archived'`). Hard delete not supported to
preserve referential integrity with batches and FAQs.

**Response 204**

---

## Course Batches

### `GET /api/admin/courses/:courseId/batches`
Returns all batches for a course.

### `POST /api/admin/courses/:courseId/batches`
Creates a batch. Required: `startDate`, `endDate`.

### `PATCH /api/admin/batches/:id`
Updates a batch (schedule, capacity, status, notes).

### `DELETE /api/admin/batches/:id`
Deletes a batch (hard delete — no foreign key dependencies on batches from other tables).

---

## FAQs

### `GET /api/admin/faqs`
Returns all FAQs (active and inactive). Optional query param: `?courseId=<uuid>`.

### `POST /api/admin/faqs`
Creates a FAQ. Required: `question`, `answer`.

### `PATCH /api/admin/faqs/:id`
Updates a FAQ.

### `DELETE /api/admin/faqs/:id`
Hard-deletes a FAQ.

---

## Announcements

Same CRUD pattern as FAQs:
- `GET /api/admin/announcements`
- `POST /api/admin/announcements` (required: `title`, `body`)
- `PATCH /api/admin/announcements/:id`
- `DELETE /api/admin/announcements/:id`

---

## Leads

### `GET /api/admin/leads`
Returns all captured leads, newest first.

**Response 200**:
```typescript
{
  leads: Array<{
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    interestedCourse: string | null;
    consentGiven: boolean;
    sessionId: string | null;
    createdAt: string;
  }>;
  total: number;
}
```

**Query params**:
- `?limit=50` (default 50, max 200)
- `?offset=0`
- `?from=YYYY-MM-DD&to=YYYY-MM-DD` (date filter)

### `DELETE /api/admin/leads/:id`
Permanently deletes a lead (GDPR erasure). Response 204.

---

## Settings

### `GET /api/admin/settings`
Returns all key-value settings.

### `PATCH /api/admin/settings`
Updates one or more settings.

**Request**:
```typescript
{ updates: Array<{ key: string; value: string }> }
```

**Response 200**: `{ settings: Setting[] }`

---

## Common Error Responses

| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Invalid/missing fields |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Authenticated but not an administrator |
| 404 | `NOT_FOUND` | Resource ID does not exist |
| 500 | `SERVER_ERROR` | Unhandled error |
