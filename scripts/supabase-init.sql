-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create files table
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id TEXT REFERENCES public.files(file_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create document_chunks table for RAG embeddings
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id TEXT NOT NULL,
    filename TEXT,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(384), -- 384 dimensions for HuggingFace all-MiniLM-L6-v2
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no authentication)
-- Files policies
CREATE POLICY "Allow public read access on files"
    ON public.files
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on files"
    ON public.files
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on files"
    ON public.files
    FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on files"
    ON public.files
    FOR DELETE
    USING (true);

-- Messages policies
CREATE POLICY "Allow public read access on messages"
    ON public.messages
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on messages"
    ON public.messages
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on messages"
    ON public.messages
    FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on messages"
    ON public.messages
    FOR DELETE
    USING (true);
Document chunks policies
CREATE POLICY "Allow public read access on document_chunks"
    ON public.document_chunks
    FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert on document_chunks"
   Vector similarity search index for document_chunks
CREATE INDEX IF NOT EXISTS idx_document_chunks_file_id ON public.document_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON public.document_chunks 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

--  ON public.document_chunks
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update on document_chunks"
    ON public.document_chunks
    FOR UPDATE
    USING (true);

CREATE POLICY "Allow public delete on document_chunks"
    ON public.document_chunks
    FOR DELETE
    USING (true);

-- 
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_file_id ON public.files(file_id);
CREATE INDEX IF NOT EXISTS idx_files_status ON public.files(status);
CREATE INDEX IF NOT EXISTS idx_messages_file_id ON public.messages(file_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON public.files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
