create extension if not exists vector;

create table if not exists public.faq_embeddings (
  id uuid primary key default gen_random_uuid(),
  faq_id uuid not null references public.faqs(id) on delete cascade,
  content text not null,
  embedding vector,
  embedding_model text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists faq_embeddings_faq_model_idx
  on public.faq_embeddings (faq_id, embedding_model);

create index if not exists faq_embeddings_faq_id_idx
  on public.faq_embeddings (faq_id);

create index if not exists faq_embeddings_embedding_model_idx
  on public.faq_embeddings (embedding_model);

create index if not exists faq_embeddings_embedding_hnsw_idx
  on public.faq_embeddings using hnsw (embedding vector_cosine_ops);

create trigger faq_embeddings_set_updated_at
  before update on public.faq_embeddings
  for each row
  execute function public.set_updated_at();

create or replace function public.match_faq_embeddings(
  query_embedding vector,
  match_embedding_model text,
  match_count integer default 5
)
returns table (
  faq_id uuid,
  content text,
  similarity double precision
)
language sql
stable
as $$
  select
    faq_embeddings.faq_id,
    faq_embeddings.content,
    1 - (faq_embeddings.embedding <=> query_embedding) as similarity
  from public.faq_embeddings
  where faq_embeddings.embedding_model = match_embedding_model
    and faq_embeddings.embedding is not null
  order by faq_embeddings.embedding <=> query_embedding
  limit match_count;
$$;
