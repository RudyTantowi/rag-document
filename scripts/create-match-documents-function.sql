-- Create RPC function for vector similarity search
-- This function is called by n8n workflow for chat

CREATE OR REPLACE FUNCTION match_documents (
  query_embedding TEXT,
  match_count INT DEFAULT 5,
  filter JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id UUID,
  file_id TEXT,
  filename TEXT,
  chunk_index INT,
  chunk_text TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  file_id_filter TEXT;
BEGIN
  -- Extract file_id from filter JSON
  file_id_filter := filter->>'file_id';
  
  RETURN QUERY
  SELECT
    dc.id,
    dc.file_id,
    dc.filename,
    dc.chunk_index,
    dc.chunk_text,
    (dc.embedding <=> query_embedding::vector) as similarity
  FROM document_chunks dc
  WHERE (file_id_filter IS NULL OR dc.file_id = file_id_filter)
  ORDER BY dc.embedding <=> query_embedding::vector
  LIMIT match_count;
END;
$$;
