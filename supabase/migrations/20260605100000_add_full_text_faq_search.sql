create extension if not exists pg_trgm;

create index if not exists faqs_active_valid_until_idx
  on public.faqs (status, valid_until);

create index if not exists faqs_full_text_idx
  on public.faqs using gin (
    to_tsvector(
      'pg_catalog.simple'::regconfig,
      coalesce(question, '') || ' ' ||
      coalesce(answer_short, '') || ' ' ||
      coalesce(answer_full, '') || ' ' ||
      coalesce(category, '') || ' ' ||
      coalesce(audience, '') || ' ' ||
      coalesce(faculty_group, '') || ' ' ||
      coalesce(source_page, '') || ' ' ||
      coalesce(source_quote, '')
    )
  );

create index if not exists faq_aliases_alias_trgm_idx
  on public.faq_aliases using gin (alias gin_trgm_ops);

create index if not exists faq_keywords_keyword_trgm_idx
  on public.faq_keywords using gin (keyword gin_trgm_ops);

create or replace function public.search_active_faqs_full_text(
  search_query text,
  match_count integer default 5
)
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
  source_last_verified_at timestamptz,
  rank real
)
language sql
stable
security definer
set search_path = public
as $$
  with query as (
    select plainto_tsquery('pg_catalog.simple'::regconfig, search_query) as ts_query
  ),
  faq_docs as (
    select
      faqs.*,
      to_tsvector(
        'pg_catalog.simple'::regconfig,
        coalesce(faqs.question, '') || ' ' ||
        coalesce(faqs.answer_short, '') || ' ' ||
        coalesce(faqs.answer_full, '') || ' ' ||
        coalesce(faqs.category, '') || ' ' ||
        coalesce(faqs.audience, '') || ' ' ||
        coalesce(faqs.faculty_group, '') || ' ' ||
        coalesce(faqs.source_page, '') || ' ' ||
        coalesce(faqs.source_quote, '')
      ) as document
    from public.faqs
    where faqs.status = 'active'
      and (faqs.valid_until is null or faqs.valid_until >= now())
  )
  select
    faq_docs.id,
    faq_docs.question,
    faq_docs.answer_short,
    faq_docs.answer_full,
    faq_docs.audience,
    faq_docs.category,
    faq_docs.faculty_group,
    faq_docs.priority,
    faq_docs.source_page,
    faq_docs.source_quote,
    faq_docs.valid_from,
    faq_docs.valid_until,
    sources.id as source_id,
    sources.name as source_name,
    sources.url as source_url,
    sources.last_verified_at as source_last_verified_at,
    ts_rank_cd(faq_docs.document, query.ts_query) as rank
  from faq_docs
  left join public.sources on sources.id = faq_docs.source_id
  cross join query
  where query.ts_query @@ faq_docs.document
  order by rank desc
  limit match_count;
$$;
