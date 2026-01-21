# Setup Hugging Face API untuk n8n

## Step 1: Dapatkan HuggingFace API Token

1. Daftar/login ke https://huggingface.co
2. Klik profile → Settings → Access Tokens
3. Klik **New token**
4. Beri nama: `n8n-embeddings`
5. Role: **Read**
6. Copy token yang dihasilkan (hf_xxxxxx...)

## Step 2: Setup Credential di n8n

### Upload Workflow:

1. Buka workflow **RAG Upload**
2. Klik node **"HuggingFace Generate Embeddings"**
3. Pada bagian "Credential to connect with"
4. Pilih **"Create New Credential"**
5. Credential Type: **Header Auth**
6. Setup:
   - Name: `Authorization`
   - Value: `Bearer YOUR_HF_TOKEN_HERE`
   - (Ganti YOUR_HF_TOKEN_HERE dengan token Anda, contoh: `Bearer hf_xxxxx`)
7. Save credential dengan nama: **HuggingFace API**

### Chat Workflow:

1. Buka workflow **RAG Chat**
2. Klik node **"HuggingFace Query Embedding"**
3. Pada "Credential to connect with"
4. Pilih credential **HuggingFace API** yang sudah dibuat
5. Save

## Step 3: Update Database Schema (IMPORTANT!)

HuggingFace model `all-MiniLM-L6-v2` menghasilkan **384 dimensional embeddings** (bukan 1536 seperti OpenAI).

Jalankan SQL ini di Supabase SQL Editor:

```sql
-- Alter table untuk dimensi baru
ALTER TABLE document_chunks
  ALTER COLUMN embedding TYPE vector(384);

-- Drop old index
DROP INDEX IF EXISTS document_chunks_embedding_idx;

-- Create new index untuk 384 dimensions
CREATE INDEX document_chunks_embedding_idx
  ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

## Step 4: Test Workflow

Setelah setup credential, test dengan:

```bash
curl -X POST https://nonrurally-nonrescissory-heaven.ngrok-free.dev/webhook/upload \
  -H "Content-Type: application/json" \
  -d @test-upload.json
```

## Model Info

- **Model:** sentence-transformers/all-MiniLM-L6-v2
- **API URL:** https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction
- **Embedding Dimension:** 384
- **Free Tier:** 30,000 requests/month
- **Max Input:** 256 word pieces (cukup untuk chunks 1000 characters)
- **Speed:** ~100-200ms per request

## Troubleshooting

### Error: "Authorization header is required"

- Pastikan credential Header Auth sudah disetup
- Format: `Bearer hf_xxxxx` (dengan spasi setelah Bearer)

### Error: "Model is currently loading"

- Model sedang cold start (first time)
- Tunggu 20-30 detik dan retry

### Error: "Rate limit exceeded"

- Sudah melebihi 30k requests/month
- Tunggu hingga bulan berikutnya atau upgrade plan

### Error: "Invalid dimensions"

- Database masih pakai vector(1536)
- Jalankan SQL di Step 3 untuk update ke vector(384)

## Keuntungan HuggingFace vs OpenAI

✅ **FREE** - 30k requests/month  
✅ Fast inference  
✅ Good quality untuk RAG  
✅ Open source model  
✅ No credit card required

❌ Sedikit kurang akurat dibanding OpenAI ada-002  
❌ Dimensi lebih kecil (384 vs 1536)
