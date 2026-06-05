alter table public.question_logs
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_action text,
  add column if not exists review_notes text,
  add column if not exists review_linked_faq_id uuid references public.faqs(id);

create index if not exists question_logs_reviewed_at_idx
  on public.question_logs (reviewed_at);

create index if not exists question_logs_review_linked_faq_id_idx
  on public.question_logs (review_linked_faq_id);
