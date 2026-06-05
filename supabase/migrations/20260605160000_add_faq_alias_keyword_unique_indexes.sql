create index if not exists faq_aliases_faq_id_alias_idx
  on public.faq_aliases (faq_id, alias);

create index if not exists faq_keywords_faq_id_keyword_idx
  on public.faq_keywords (faq_id, keyword);

-- TODO: add case/space-insensitive unique indexes after existing duplicate data is audited.
