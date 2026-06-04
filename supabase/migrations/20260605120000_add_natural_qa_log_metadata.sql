alter table public.question_logs
  add column if not exists trigger_type text,
  add column if not exists intent text;

create index if not exists question_logs_trigger_type_idx
  on public.question_logs (trigger_type);

create index if not exists question_logs_intent_idx
  on public.question_logs (intent);
