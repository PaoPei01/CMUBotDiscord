create extension if not exists pgcrypto;

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  source_type text not null default 'website',
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null,
  answer text not null,
  source_id uuid references public.sources(id),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint faqs_status_check check (status in ('active', 'inactive'))
);

create table public.faq_aliases (
  id uuid primary key default gen_random_uuid(),
  faq_id uuid not null references public.faqs(id) on delete cascade,
  alias text not null,
  created_at timestamptz not null default now()
);

create table public.faq_keywords (
  id uuid primary key default gen_random_uuid(),
  faq_id uuid not null references public.faqs(id) on delete cascade,
  keyword text not null,
  created_at timestamptz not null default now()
);

create table public.question_logs (
  id uuid primary key default gen_random_uuid(),
  user_question text not null,
  matched_faq_id uuid references public.faqs(id),
  confidence numeric,
  method text,
  response_time_ms integer,
  discord_user_id text,
  discord_guild_id text,
  created_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  question_log_id uuid not null references public.question_logs(id) on delete cascade,
  vote text not null,
  comment text,
  discord_user_id text,
  created_at timestamptz not null default now(),
  constraint feedback_vote_check check (vote in ('up', 'down'))
);

create index sources_name_idx on public.sources (name);
create index faqs_question_idx on public.faqs (question);
create index faqs_category_idx on public.faqs (category);
create index faqs_status_idx on public.faqs (status);
create index faq_aliases_alias_idx on public.faq_aliases (alias);
create index faq_keywords_keyword_idx on public.faq_keywords (keyword);
create index question_logs_created_at_idx on public.question_logs (created_at);
create index feedback_vote_idx on public.feedback (vote);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sources_set_updated_at
before update on public.sources
for each row
execute function public.set_updated_at();

create trigger faqs_set_updated_at
before update on public.faqs
for each row
execute function public.set_updated_at();
