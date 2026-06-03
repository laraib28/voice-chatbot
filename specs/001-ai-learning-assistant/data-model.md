# Data Model: AI Learning Assistant Platform

**Branch**: `001-ai-learning-assistant` | **Date**: 2026-06-02
**Source**: spec.md Key Entities + research.md RLS Strategy

---

## Entity Relationship Overview

```
courses ──< course_batches
courses ──< faqs           (nullable course_id = platform-wide)
courses ──< announcements  (nullable course_id = platform-wide)
chat_sessions ──< chat_messages
chat_sessions ──< leads    (nullable session_id)
auth.users ──< administrators
settings   (singleton key/value store)
```

---

## Table Definitions

### `courses`

Represents an educational programme offered by the institute.

```sql
CREATE TABLE courses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  duration        text,                         -- e.g. "8 weeks", "3 days"
  target_audience text,
  prerequisites   text,
  pricing         numeric(10, 2),
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'archived')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER set_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

**RLS Policies**:
```sql
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Anonymous: read active courses only
CREATE POLICY "anon_read_active_courses" ON courses
  FOR SELECT USING (status = 'active');

-- Admin: full access
CREATE POLICY "admin_all_courses" ON courses
  FOR ALL USING (auth.uid() IN (SELECT id FROM administrators))
  WITH CHECK (auth.uid() IN (SELECT id FROM administrators));
```

---

### `course_batches`

A scheduled run of a course (specific dates, capacity, location).

```sql
CREATE TABLE course_batches (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id      uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  start_date     date NOT NULL,
  end_date       date NOT NULL,
  capacity       integer,
  enrolled_count integer NOT NULL DEFAULT 0,
  status         text NOT NULL DEFAULT 'upcoming'
                 CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  location       text,                          -- "Online" or physical address
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_course_batches_updated_at
  BEFORE UPDATE ON course_batches
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

**RLS Policies**:
```sql
ALTER TABLE course_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_batches" ON course_batches
  FOR SELECT USING (status IN ('upcoming', 'ongoing'));

CREATE POLICY "admin_all_batches" ON course_batches
  FOR ALL USING (auth.uid() IN (SELECT id FROM administrators))
  WITH CHECK (auth.uid() IN (SELECT id FROM administrators));
```

---

### `faqs`

A question-and-answer pair. `course_id = NULL` means platform-wide.

```sql
CREATE TABLE faqs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    uuid REFERENCES courses(id) ON DELETE CASCADE, -- NULL = platform-wide
  question     text NOT NULL,
  answer       text NOT NULL,
  order_index  integer NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_faqs_updated_at
  BEFORE UPDATE ON faqs
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

**RLS Policies**:
```sql
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_active_faqs" ON faqs
  FOR SELECT USING (is_active = true);

CREATE POLICY "admin_all_faqs" ON faqs
  FOR ALL USING (auth.uid() IN (SELECT id FROM administrators))
  WITH CHECK (auth.uid() IN (SELECT id FROM administrators));
```

---

### `announcements`

Time-bounded notices for all users or a specific course audience.

```sql
CREATE TABLE announcements (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  uuid REFERENCES courses(id) ON DELETE CASCADE, -- NULL = platform-wide
  title      text NOT NULL,
  body       text NOT NULL,
  starts_at  timestamptz,
  ends_at    timestamptz,                       -- NULL = no expiry
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

**RLS Policies**:
```sql
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_active_announcements" ON announcements
  FOR SELECT USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

CREATE POLICY "admin_all_announcements" ON announcements
  FOR ALL USING (auth.uid() IN (SELECT id FROM administrators))
  WITH CHECK (auth.uid() IN (SELECT id FROM administrators));
```

---

### `leads`

Contact records submitted by visitors who expressed enrolment interest.

```sql
CREATE TABLE leads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text,
  phone             text,
  email             text,
  interested_course text,                       -- course name as free text (not FK)
  consent_given     boolean NOT NULL DEFAULT true,
  session_id        uuid REFERENCES chat_sessions(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);
```

**Validation constraints** (enforced server-side in API route, not DB):
- At least one of `name`, `phone`, `email` MUST be non-null per FR-018 (partial leads allowed).
- `email` format validated server-side before INSERT.

**RLS Policies**:
```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- No anonymous SELECT (privacy)
-- INSERT is performed via server-side API route using service role key — bypasses RLS.
-- Admin SELECT only.
CREATE POLICY "admin_read_leads" ON leads
  FOR SELECT USING (auth.uid() IN (SELECT id FROM administrators));

-- Admin can delete leads (GDPR right to erasure)
CREATE POLICY "admin_delete_leads" ON leads
  FOR DELETE USING (auth.uid() IN (SELECT id FROM administrators));
```

---

### `chat_sessions`

A single conversation instance (text or voice).

```sql
CREATE TABLE chat_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_language text NOT NULL DEFAULT 'en'
                    CHECK (detected_language IN ('en', 'ur', 'roman_ur')),
  channel           text NOT NULL DEFAULT 'text'
                    CHECK (channel IN ('voice', 'text')),
  started_at        timestamptz NOT NULL DEFAULT now(),
  ended_at          timestamptz,
  user_agent        text                        -- browser UA for analytics
);
```

**RLS Policies**:
```sql
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Anonymous INSERT (session creation by chat client)
CREATE POLICY "anon_insert_sessions" ON chat_sessions
  FOR INSERT WITH CHECK (true);

-- Admin SELECT for analytics
CREATE POLICY "admin_read_sessions" ON chat_sessions
  FOR SELECT USING (auth.uid() IN (SELECT id FROM administrators));
```

---

### `chat_messages`

Individual turns within a chat session.

```sql
CREATE TABLE chat_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at);
```

**RLS Policies**:
```sql
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_read_messages" ON chat_messages
  FOR SELECT USING (auth.uid() IN (SELECT id FROM administrators));
```

---

### `administrators`

Maps Supabase Auth users to the admin role.

```sql
CREATE TABLE administrators (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  full_name     text,
  role          text NOT NULL DEFAULT 'admin',
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

**RLS Policies**:
```sql
ALTER TABLE administrators ENABLE ROW LEVEL SECURITY;

-- Admin can read their own record
CREATE POLICY "admin_read_own" ON administrators
  FOR SELECT USING (auth.uid() = id);

-- Only existing admins can insert new admins (bootstrapped manually for first admin)
CREATE POLICY "admin_insert_admin" ON administrators
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM administrators));
```

---

### `settings`

Key-value configuration store for platform-wide settings.

```sql
CREATE TABLE settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text UNIQUE NOT NULL,
  value       text NOT NULL,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

**Seed values** (required for initial boot):
```sql
INSERT INTO settings (key, value, description) VALUES
  ('institute_name',    'Your Institute Name', 'Displayed in AI greetings and emails'),
  ('contact_email',     'info@example.com',    'Escalation contact for AI fallback'),
  ('contact_phone',     '',                    'Phone number for escalation'),
  ('operating_hours',   'Mon–Fri 9am–6pm',     'Shown when asking about availability'),
  ('escalation_message','Please contact us at info@example.com for further assistance.',
                        'Message shown when AI cannot answer');
```

**RLS Policies**:
```sql
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "admin_update_settings" ON settings
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM administrators))
  WITH CHECK (auth.uid() IN (SELECT id FROM administrators));
```

---

## Migration Order

1. `001_initial_schema.sql` — Create all tables (courses, course_batches, faqs,
   announcements, leads, chat_sessions, chat_messages, administrators, settings)
   + `moddatetime` extension + triggers.
2. `002_rls_policies.sql` — Enable RLS and create all policies.
3. `003_seed_data.sql` — Insert default `settings` rows.

---

## State Transitions

### Course status
```
active ──[archive]──> archived
archived ──[restore]──> active
```

### Course Batch status
```
upcoming ──[start date reached]──> ongoing
ongoing ──[end date reached]──> completed
upcoming|ongoing ──[admin cancel]──> cancelled
```

### Chat Session
```
(created) ──[first message]──> active ──[tab close / timeout]──> ended
```

---

## Indexes (performance)

```sql
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_faqs_course ON faqs(course_id, is_active);
CREATE INDEX idx_announcements_active ON announcements(is_active, starts_at, ends_at);
CREATE INDEX idx_course_batches_course ON course_batches(course_id, status);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
```
