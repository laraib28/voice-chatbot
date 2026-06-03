# Quickstart: AI Learning Assistant Platform

**Branch**: `001-ai-learning-assistant` | **Date**: 2026-06-02

---

## Prerequisites

- Node.js 20+
- pnpm 9+ (or npm/yarn)
- Supabase CLI (`npm i -g supabase`)
- A Supabase project (free tier works for development)
- An OpenAI API key with access to `gpt-4o-realtime-preview`

---

## 1. Clone and Install

```bash
git clone <repo-url>
cd voice-chatbot
git checkout 001-ai-learning-assistant
pnpm install
```

---

## 2. Environment Variables

Copy the example env file and fill in values:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>          # Safe to expose to browser
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>       # NEVER expose to browser

# OpenAI
OPENAI_API_KEY=<your-openai-api-key>               # NEVER expose to browser

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Security reminder**: `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` MUST
NOT appear in any `NEXT_PUBLIC_*` variable or any client-side code.

---

## 3. Supabase Setup

### 3a. Link your project

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

### 3b. Run migrations

```bash
supabase db push
```

This runs:
- `001_initial_schema.sql` — tables + triggers
- `002_rls_policies.sql` — RLS policies
- `003_seed_data.sql` — default settings rows

### 3c. Create first administrator

In the Supabase dashboard, create a user via Authentication → Users.
Then run in the SQL editor:

```sql
INSERT INTO administrators (id, email, full_name)
VALUES ('<auth-user-uuid>', 'admin@yourinstitute.com', 'Admin Name');
```

### 3d. Configure settings

Update the settings table with your institute's information:

```sql
UPDATE settings SET value = 'Your Institute Name' WHERE key = 'institute_name';
UPDATE settings SET value = 'admin@yourinstitute.com' WHERE key = 'contact_email';
```

---

## 4. Run Development Server

```bash
pnpm dev
```

Open http://localhost:3000 — the chat interface loads immediately (no login required).

Admin panel: http://localhost:3000/admin (requires admin login).

---

## 5. Verify Everything Works

### Chat (text)
1. Open http://localhost:3000
2. Type "What courses do you offer?"
3. The assistant should list courses from your Supabase database.

If no courses are in the database yet, add one via the admin panel first.

### Voice
1. Open http://localhost:3000
2. Click the microphone icon — browser will request microphone permission.
3. Allow — the voice button activates.
4. Speak a question; the assistant responds with voice.

If microphone is denied, the UI falls back to text-only automatically.

### Admin Panel
1. Navigate to http://localhost:3000/admin
2. Log in with the admin credentials created in step 3c.
3. Create a course: Courses → New Course → fill in details → Save.
4. Return to chat and ask about the course — it should appear immediately.

---

## 6. Running Tests

```bash
# Unit tests (agent tools, validators)
pnpm test:unit

# E2E tests (requires dev server running)
pnpm dev &
pnpm test:e2e
```

E2E tests cover:
- Text chat with language switching (EN / Urdu / Roman Urdu)
- Lead capture consent flow
- Admin CRUD: create course → verify in chat
- Voice fallback when microphone unavailable (simulated)

---

## 7. Deployment

### Vercel

```bash
vercel --prod
```

Set environment variables in Vercel dashboard → Project → Settings → Environment Variables.
Add all variables from `.env.local` (mark `SUPABASE_SERVICE_ROLE_KEY` and
`OPENAI_API_KEY` as Server-only — do NOT expose to the browser).

### Supabase

Production database is already live on Supabase Cloud. Push any new migrations:

```bash
supabase db push --linked
```

---

## 8. Common Issues

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| "No courses found" | Database is empty | Add courses via admin panel |
| Voice button disabled | Browser lacks microphone | Use text mode; check browser permissions |
| 401 on admin routes | No admin session | Log in at `/auth/login` |
| 403 on admin routes | User not in `administrators` table | Add user to `administrators` via SQL |
| AI gives wrong language | Language detection lag | Clear session cookie and retry |
| Realtime API error | OpenAI key lacks `gpt-4o-realtime-preview` | Check OpenAI key permissions / model access |
