create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null,
  url text,
  file_name text,
  mime_type text,
  content_hash text,
  status text not null default 'processed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_sources_source_type_check
    check (source_type in ('pdf', 'docx', 'txt', 'markdown', 'url')),
  constraint knowledge_sources_status_check
    check (status in ('processing', 'processed', 'failed', 'archived'))
);

create table if not exists public.ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  knowledge_source_id uuid not null references public.knowledge_sources(id) on delete cascade,
  status text not null default 'queued',
  parser text not null,
  chunk_size_words integer not null default 1000,
  overlap_words integer not null default 150,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint ingestion_jobs_status_check
    check (status in ('queued', 'running', 'completed', 'failed'))
);

create table if not exists public.draft_faqs (
  id uuid primary key default gen_random_uuid(),
  ingestion_job_id uuid not null references public.ingestion_jobs(id) on delete cascade,
  knowledge_source_id uuid not null references public.knowledge_sources(id) on delete cascade,
  question text not null,
  answer text not null,
  category text not null,
  confidence numeric not null default 0,
  status text not null default 'pending',
  duplicate_of_faq_id uuid references public.faqs(id),
  duplicate_of_draft_id uuid references public.draft_faqs(id),
  duplicate_confidence numeric,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint draft_faqs_status_check
    check (status in ('pending', 'approved', 'rejected', 'duplicate'))
);

create table if not exists public.draft_keywords (
  id uuid primary key default gen_random_uuid(),
  draft_faq_id uuid not null references public.draft_faqs(id) on delete cascade,
  keyword text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_reviews (
  id uuid primary key default gen_random_uuid(),
  draft_faq_id uuid references public.draft_faqs(id) on delete set null,
  action text not null,
  reviewer text,
  notes text,
  production_faq_id uuid references public.faqs(id),
  created_at timestamptz not null default now(),
  constraint knowledge_reviews_action_check
    check (action in ('approve', 'reject', 'edit', 'bulk_approve', 'bulk_reject'))
);

create table if not exists public.knowledge_import_logs (
  id uuid primary key default gen_random_uuid(),
  ingestion_job_id uuid references public.ingestion_jobs(id) on delete cascade,
  draft_faq_id uuid references public.draft_faqs(id) on delete set null,
  action text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_sources_source_type_idx on public.knowledge_sources (source_type);
create index if not exists knowledge_sources_status_idx on public.knowledge_sources (status);
create index if not exists ingestion_jobs_status_idx on public.ingestion_jobs (status);
create index if not exists ingestion_jobs_created_at_idx on public.ingestion_jobs (created_at);
create index if not exists draft_faqs_status_idx on public.draft_faqs (status);
create index if not exists draft_faqs_question_idx on public.draft_faqs (question);
create index if not exists draft_keywords_keyword_idx on public.draft_keywords (keyword);
create index if not exists knowledge_reviews_action_idx on public.knowledge_reviews (action);
create index if not exists knowledge_import_logs_created_at_idx on public.knowledge_import_logs (created_at);

create trigger knowledge_sources_set_updated_at
  before update on public.knowledge_sources
  for each row
  execute function public.set_updated_at();

create trigger ingestion_jobs_set_updated_at
  before update on public.ingestion_jobs
  for each row
  execute function public.set_updated_at();

create trigger draft_faqs_set_updated_at
  before update on public.draft_faqs
  for each row
  execute function public.set_updated_at();
