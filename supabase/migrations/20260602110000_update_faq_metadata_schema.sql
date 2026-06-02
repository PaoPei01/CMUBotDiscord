alter table public.sources
  alter column source_type set default 'document';

alter table public.faqs
  add column if not exists faq_code text,
  add column if not exists audience text,
  add column if not exists faculty_group text,
  add column if not exists answer_short text,
  add column if not exists answer_full text,
  add column if not exists source_page text,
  add column if not exists source_quote text,
  add column if not exists valid_from timestamptz,
  add column if not exists valid_until timestamptz,
  add column if not exists priority text default 'medium';

update public.faqs
set faq_code = coalesce(nullif(faq_code, ''), id::text)
where faq_code is null or faq_code = '';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'faqs'
      and column_name = 'answer'
  ) then
    execute 'update public.faqs set answer_short = coalesce(nullif(answer_short, ''''), answer) where answer_short is null or answer_short = ''''';
    execute 'update public.faqs set answer_full = coalesce(answer_full, answer) where answer_full is null';
  end if;
end $$;

update public.faqs
set answer_short = coalesce(nullif(answer_short, ''), question)
where answer_short is null or answer_short = '';

update public.faqs
set priority = 'medium'
where priority is null or priority = '';

alter table public.faqs
  alter column faq_code set not null,
  alter column answer_short set not null,
  alter column priority set default 'medium';

alter table public.faqs
  drop constraint if exists faqs_status_check;

alter table public.faqs
  add constraint faqs_status_check
  check (status in ('active', 'draft', 'expired', 'inactive'));

alter table public.faqs
  drop constraint if exists faqs_priority_check;

alter table public.faqs
  add constraint faqs_priority_check
  check (priority in ('high', 'medium', 'low'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'faqs_faq_code_key'
      and conrelid = 'public.faqs'::regclass
  ) then
    alter table public.faqs
      add constraint faqs_faq_code_key unique (faq_code);
  end if;
end $$;

create table if not exists public.faq_relations (
  id uuid primary key default gen_random_uuid(),
  faq_id uuid not null references public.faqs(id) on delete cascade,
  related_faq_id uuid not null references public.faqs(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists faqs_faq_code_idx on public.faqs (faq_code);
create index if not exists faqs_audience_idx on public.faqs (audience);
create index if not exists faqs_faculty_group_idx on public.faqs (faculty_group);
create index if not exists faqs_valid_from_idx on public.faqs (valid_from);
create index if not exists faqs_valid_until_idx on public.faqs (valid_until);
create index if not exists sources_url_idx on public.sources (url);
