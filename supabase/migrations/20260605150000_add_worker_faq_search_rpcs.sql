create or replace function public.normalize_faq_search_text(input text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(trim(coalesce(input, ''))), '\s+', ' ', 'g');
$$;

create index if not exists faqs_normalized_question_active_idx
  on public.faqs (public.normalize_faq_search_text(question))
  where status = 'active';

create index if not exists faq_aliases_normalized_alias_idx
  on public.faq_aliases (public.normalize_faq_search_text(alias));

create index if not exists faq_keywords_normalized_keyword_idx
  on public.faq_keywords (public.normalize_faq_search_text(keyword));

create or replace function public.search_active_faq_exact(search_query text)
returns table (
  id uuid,
  question text,
  answer_short text,
  answer_full text,
  audience text,
  category text,
  faculty_group text,
  priority text,
  source_page text,
  source_quote text,
  valid_from timestamptz,
  valid_until timestamptz,
  source_id uuid,
  source_name text,
  source_url text,
  source_last_verified_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    faqs.id,
    faqs.question,
    faqs.answer_short,
    faqs.answer_full,
    faqs.audience,
    faqs.category,
    faqs.faculty_group,
    faqs.priority,
    faqs.source_page,
    faqs.source_quote,
    faqs.valid_from,
    faqs.valid_until,
    sources.id as source_id,
    sources.name as source_name,
    sources.url as source_url,
    sources.last_verified_at as source_last_verified_at
  from public.faqs
  left join public.sources on sources.id = faqs.source_id
  where faqs.status = 'active'
    and (faqs.valid_until is null or faqs.valid_until >= now())
    and public.normalize_faq_search_text(faqs.question) = public.normalize_faq_search_text(search_query)
  order by faqs.priority desc, faqs.updated_at desc
  limit 1;
$$;

create or replace function public.search_active_faq_alias(search_query text)
returns table (
  id uuid,
  question text,
  answer_short text,
  answer_full text,
  audience text,
  category text,
  faculty_group text,
  priority text,
  source_page text,
  source_quote text,
  valid_from timestamptz,
  valid_until timestamptz,
  source_id uuid,
  source_name text,
  source_url text,
  source_last_verified_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    faqs.id,
    faqs.question,
    faqs.answer_short,
    faqs.answer_full,
    faqs.audience,
    faqs.category,
    faqs.faculty_group,
    faqs.priority,
    faqs.source_page,
    faqs.source_quote,
    faqs.valid_from,
    faqs.valid_until,
    sources.id as source_id,
    sources.name as source_name,
    sources.url as source_url,
    sources.last_verified_at as source_last_verified_at
  from public.faq_aliases
  join public.faqs on faqs.id = faq_aliases.faq_id
  left join public.sources on sources.id = faqs.source_id
  where faqs.status = 'active'
    and (faqs.valid_until is null or faqs.valid_until >= now())
    and public.normalize_faq_search_text(faq_aliases.alias) = public.normalize_faq_search_text(search_query)
  order by faqs.priority desc, faqs.updated_at desc
  limit 1;
$$;

create or replace function public.search_active_faq_keyword(search_query text)
returns table (
  id uuid,
  question text,
  answer_short text,
  answer_full text,
  audience text,
  category text,
  faculty_group text,
  priority text,
  source_page text,
  source_quote text,
  valid_from timestamptz,
  valid_until timestamptz,
  source_id uuid,
  source_name text,
  source_url text,
  source_last_verified_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with matched_keywords as (
    select
      faqs.id as faq_id,
      count(*) as keyword_count,
      max(length(faq_keywords.keyword)) as longest_keyword
    from public.faq_keywords
    join public.faqs on faqs.id = faq_keywords.faq_id
    where faqs.status = 'active'
      and (faqs.valid_until is null or faqs.valid_until >= now())
      and public.normalize_faq_search_text(search_query) like
        '%' || public.normalize_faq_search_text(faq_keywords.keyword) || '%'
    group by faqs.id
  )
  select
    faqs.id,
    faqs.question,
    faqs.answer_short,
    faqs.answer_full,
    faqs.audience,
    faqs.category,
    faqs.faculty_group,
    faqs.priority,
    faqs.source_page,
    faqs.source_quote,
    faqs.valid_from,
    faqs.valid_until,
    sources.id as source_id,
    sources.name as source_name,
    sources.url as source_url,
    sources.last_verified_at as source_last_verified_at
  from matched_keywords
  join public.faqs on faqs.id = matched_keywords.faq_id
  left join public.sources on sources.id = faqs.source_id
  order by matched_keywords.keyword_count desc, matched_keywords.longest_keyword desc, faqs.updated_at desc
  limit 1;
$$;
