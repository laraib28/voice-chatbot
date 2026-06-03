-- Enable RLS on all tables
alter table courses         enable row level security;
alter table course_batches  enable row level security;
alter table faqs            enable row level security;
alter table announcements   enable row level security;
alter table leads           enable row level security;
alter table chat_sessions   enable row level security;
alter table chat_messages   enable row level security;
alter table administrators  enable row level security;
alter table settings        enable row level security;

-- ─────────────────────────────────────────
-- COURSES — anon can read active, admin full access
-- ─────────────────────────────────────────
create policy "anon read active courses"
  on courses for select
  to anon, authenticated
  using (status = 'active');

create policy "service role full access courses"
  on courses for all
  to service_role
  using (true)
  with check (true);

-- ─────────────────────────────────────────
-- COURSE BATCHES
-- ─────────────────────────────────────────
create policy "anon read course batches"
  on course_batches for select
  to anon, authenticated
  using (true);

create policy "service role full access course_batches"
  on course_batches for all
  to service_role
  using (true)
  with check (true);

-- ─────────────────────────────────────────
-- FAQS
-- ─────────────────────────────────────────
create policy "anon read active faqs"
  on faqs for select
  to anon, authenticated
  using (is_active = true);

create policy "service role full access faqs"
  on faqs for all
  to service_role
  using (true)
  with check (true);

-- ─────────────────────────────────────────
-- ANNOUNCEMENTS
-- ─────────────────────────────────────────
create policy "anon read active announcements"
  on announcements for select
  to anon, authenticated
  using (is_active = true);

create policy "service role full access announcements"
  on announcements for all
  to service_role
  using (true)
  with check (true);

-- ─────────────────────────────────────────
-- LEADS — insert only via service role (no anon direct insert)
-- ─────────────────────────────────────────
create policy "service role full access leads"
  on leads for all
  to service_role
  using (true)
  with check (true);

-- ─────────────────────────────────────────
-- CHAT SESSIONS
-- ─────────────────────────────────────────
create policy "service role full access chat_sessions"
  on chat_sessions for all
  to service_role
  using (true)
  with check (true);

-- ─────────────────────────────────────────
-- CHAT MESSAGES
-- ─────────────────────────────────────────
create policy "service role full access chat_messages"
  on chat_messages for all
  to service_role
  using (true)
  with check (true);

-- ─────────────────────────────────────────
-- ADMINISTRATORS
-- ─────────────────────────────────────────
create policy "service role full access administrators"
  on administrators for all
  to service_role
  using (true)
  with check (true);

-- ─────────────────────────────────────────
-- SETTINGS — anon can read, service role can write
-- ─────────────────────────────────────────
create policy "anon read settings"
  on settings for select
  to anon, authenticated
  using (true);

create policy "service role full access settings"
  on settings for all
  to service_role
  using (true)
  with check (true);
