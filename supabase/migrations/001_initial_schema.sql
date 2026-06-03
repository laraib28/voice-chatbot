-- Enable moddatetime extension for auto-updating updated_at
create extension if not exists moddatetime schema extensions;

-- ─────────────────────────────────────────
-- COURSES
-- ─────────────────────────────────────────
create table if not exists courses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  duration    text,
  target_audience text,
  prerequisites   text,
  pricing     text,
  status      text not null default 'active' check (status in ('active','archived','draft')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger handle_updated_at_courses
  before update on courses
  for each row execute procedure extensions.moddatetime(updated_at);

-- ─────────────────────────────────────────
-- COURSE BATCHES
-- ─────────────────────────────────────────
create table if not exists course_batches (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid not null references courses(id) on delete cascade,
  start_date      date,
  end_date        date,
  capacity        integer,
  enrolled_count  integer not null default 0,
  location        text,
  notes           text,
  status          text not null default 'upcoming' check (status in ('upcoming','ongoing','completed','cancelled')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger handle_updated_at_course_batches
  before update on course_batches
  for each row execute procedure extensions.moddatetime(updated_at);

create index if not exists idx_course_batches_course_id on course_batches(course_id);

-- ─────────────────────────────────────────
-- FAQS
-- ─────────────────────────────────────────
create table if not exists faqs (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid references courses(id) on delete set null,
  question    text not null,
  answer      text not null,
  order_index integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger handle_updated_at_faqs
  before update on faqs
  for each row execute procedure extensions.moddatetime(updated_at);

create index if not exists idx_faqs_course_id on faqs(course_id);

-- ─────────────────────────────────────────
-- ANNOUNCEMENTS
-- ─────────────────────────────────────────
create table if not exists announcements (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid references courses(id) on delete set null,
  title       text not null,
  body        text not null,
  is_active   boolean not null default true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger handle_updated_at_announcements
  before update on announcements
  for each row execute procedure extensions.moddatetime(updated_at);

-- ─────────────────────────────────────────
-- LEADS
-- ─────────────────────────────────────────
create table if not exists leads (
  id                uuid primary key default gen_random_uuid(),
  session_id        uuid,
  name              text,
  phone             text,
  email             text,
  interested_course text,
  consent_given     boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger handle_updated_at_leads
  before update on leads
  for each row execute procedure extensions.moddatetime(updated_at);

create index if not exists idx_leads_created_at on leads(created_at desc);

-- ─────────────────────────────────────────
-- CHAT SESSIONS
-- ─────────────────────────────────────────
create table if not exists chat_sessions (
  id                uuid primary key,
  detected_language text not null default 'en',
  channel           text not null default 'text' check (channel in ('text','voice')),
  user_agent        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger handle_updated_at_chat_sessions
  before update on chat_sessions
  for each row execute procedure extensions.moddatetime(updated_at);

-- ─────────────────────────────────────────
-- CHAT MESSAGES
-- ─────────────────────────────────────────
create table if not exists chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references chat_sessions(id) on delete cascade,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_chat_messages_session_id on chat_messages(session_id, created_at);

-- ─────────────────────────────────────────
-- ADMINISTRATORS
-- ─────────────────────────────────────────
create table if not exists administrators (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- SETTINGS
-- ─────────────────────────────────────────
create table if not exists settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

create trigger handle_updated_at_settings
  before update on settings
  for each row execute procedure extensions.moddatetime(updated_at);
