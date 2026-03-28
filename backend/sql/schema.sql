-- ============================================================
-- Intelligent Recruitment Copilot — Supabase Schema
-- Run this entire script once in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Step 1: Enable the pgvector extension (provides vector type + operators)
create extension if not exists vector with schema extensions;

-- Step 2: Candidates table — one row per uploaded resume
create table if not exists candidates (
    id          uuid        primary key default gen_random_uuid(),
    filename    text        not null,
    upload_date timestamptz not null default now()
);

-- Step 3: Documents table — one row per text chunk, stores the embedding
create table if not exists documents (
    id           bigserial   primary key,
    candidate_id uuid        references candidates(id) on delete cascade,
    filename     text        not null,
    content      text        not null,
    metadata     jsonb,
    -- 384 dimensions matches all-MiniLM-L6-v2 — update if you change the model
    embedding    vector(384)
);

-- Step 4: IVFFlat index for fast approximate nearest-neighbour search
--         (lists=100 is a good default for small-medium datasets)
create index if not exists documents_embedding_idx
    on documents
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

-- Step 5: RPC function called by LangChain's SupabaseVectorStore
--         DO NOT rename this function — LangChain looks it up by name.
create or replace function match_documents(
    query_embedding  vector(384),
    match_count      int     default 5,
    filter           jsonb   default '{}'
)
returns table (
    id          bigint,
    content     text,
    metadata    jsonb,
    similarity  float
)
language plpgsql
as $$
begin
    return query
    select
        d.id,
        d.content,
        d.metadata,
        1 - (d.embedding <=> query_embedding) as similarity
    from documents d
    where d.metadata @> filter
    order by d.embedding <=> query_embedding
    limit match_count;
end;
$$;
