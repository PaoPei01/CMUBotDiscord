create extension if not exists pg_trgm;

create index if not exists faqs_active_valid_until_idx
  on public.faqs (status, valid_until);

create index if not exists faqs_full_text_idx
  on public.faqs using gin (
    to_tsvector(
      'simple',
      concat_ws(
        ' ',
        question,
        answer_short,
        answer_full,
        category,
        audience,
        faculty_group,
        source_page,
        source_quote
      )
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
    select plainto_tsquery('simple', search_query) as ts_query
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
    sources.last_verified_at as source_last_verified_at,
    ts_rank_cd(
      to_tsvector(
        'simple',
        concat_ws(
          ' ',
          faqs.question,
          faqs.answer_short,
          faqs.answer_full,
          faqs.category,
          faqs.audience,
          faqs.faculty_group,
          faqs.source_page,
          faqs.source_quote
        )
      ),
      query.ts_query
    ) as rank
  from public.faqs
  left join public.sources on sources.id = faqs.source_id
  cross join query
  where faqs.status = 'active'
    and (faqs.valid_until is null or faqs.valid_until >= now())
    and query.ts_query @@ to_tsvector(
      'simple',
      concat_ws(
        ' ',
        faqs.question,
        faqs.answer_short,
        faqs.answer_full,
        faqs.category,
        faqs.audience,
        faqs.faculty_group,
        faqs.source_page,
        faqs.source_quote
      )
    )
  order by rank desc
  limit match_count;
$$;
