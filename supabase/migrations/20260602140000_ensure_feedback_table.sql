create extension if not exists pgcrypto;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  question_log_id uuid not null references public.question_logs(id) on delete cascade,
  vote text not null,
  comment text,
  discord_user_id text,
  created_at timestamptz not null default now(),
  constraint feedback_vote_check check (vote in ('up', 'down'))
);

create index if not exists feedback_vote_idx on public.feedback (vote);
create index if not exists feedback_question_log_id_idx on public.feedback (question_log_id);
