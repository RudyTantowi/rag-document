-- SQL untuk membuat tabel document_chunks
-- Copy paste ini ke Supabase SQL Editor dan Run

-- Enable vector extension (jika belum)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document_chunks table
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id TEXT NOT NULL,
    filename TEXT,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(384), -- 384 dimensions for HuggingFace all-MiniLM-L6-v2
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Create policies (public access)
CREATE POLICY "Allow public read access on document_chunks"
    ON public.document_chunks FOR SELECT USING (true);

CREATE POLICY "Allow public insert on document_chunks"
    ON public.document_chunks FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on document_chunks"
    ON public.document_chunks FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on document_chunks"
    ON public.document_chunks FOR DELETE USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_chunks_file_id 
    ON public.document_chunks(file_id);

CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
    ON public.document_chunks 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
