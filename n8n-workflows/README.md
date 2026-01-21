# n8n Workflows untuk RAG Chatbot

## File yang Tersedia

1. **rag-upload-workflow.json** - Workflow untuk upload dan proses dokumen
2. **rag-chat-workflow.json** - Workflow untuk chat dengan AI

## Cara Import ke n8n

### Step 1: Import Workflow

1. Buka n8n dashboard Anda
2. Klik tombol **"Add workflow"** atau **"Import from file"**
3. Upload file JSON:
   - `rag-upload-workflow.json`
   - `rag-chat-workflow.json`

### Step 2: Konfigurasi Credentials

Setelah import, Anda perlu setup credentials berikut:

#### OpenAI API

1. Klik node OpenAI mana saja
2. Klik **"Credential to connect with"**
3. Pilih **"Create New Credential"**
4. Masukkan OpenAI API Key Anda
5. Save

#### Supabase API

1. Klik node Supabase mana saja
2. Klik **"Credential to connect with"**
3. Pilih **"Create New Credential"**
4. Masukkan:
   - Supabase URL: `https://your-project.supabase.co`
   - Supabase Key: `your-service-role-key`
5. Save

### Step 3: Aktifkan Workflow

1. Buka setiap workflow
2. Klik toggle **"Active"** di kanan atas
3. Workflow akan mulai listen ke webhook

### Step 4: Dapatkan Webhook URLs

Setelah workflow aktif:

1. Klik node **"Webhook"** di setiap workflow
2. Copy **"Production URL"** atau **"Test URL"**
3. Update URL di Next.js project Anda:
   - Upload URL: untuk `/api/upload/route.ts`
   - Chat URL: untuk `/api/chat/route.ts`

## URL Endpoints (dengan ngrok)

Jika menggunakan ngrok gateway seperti di dokumentasi:

- Upload: `https://nonrurally-nonrescissory-heaven.ngrok-free.dev/upload`
- Chat: `https://nonrurally-nonrescissory-heaven.ngrok-free.dev/chat`

**Note:** Ganti dengan ngrok URL Anda yang sebenarnya!

## Database Schema yang Dibutuhkan

Pastikan tabel `document_chunks` sudah dibuat di Supabase:

```sql
CREATE TABLE document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL,
  filename TEXT,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536), -- untuk OpenAI ada-002
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk vector similarity search
CREATE INDEX ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index untuk file_id filter
CREATE INDEX idx_document_chunks_file_id ON document_chunks(file_id);
```

## Testing Workflows

### Test Upload Workflow

```bash
curl -X POST https://your-n8n-url/webhook/upload \
  -H "Content-Type: application/json" \
  -d '{
    "file_id": "test-123",
    "filename": "test.pdf",
    "text": "This is a test document content for testing the RAG system."
  }'
```

### Test Chat Workflow

```bash
curl -X POST https://your-n8n-url/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is this document about?",
    "file_id": "test-123"
  }'
```

## Troubleshooting

### Error: "Missing credentials"

- Pastikan semua credentials (OpenAI, Supabase) sudah dikonfigurasi
- Cek credential ID match dengan yang ada di workflow

### Error: "Webhook not found"

- Pastikan workflow sudah **Active**
- Restart workflow jika perlu

### Error: "Cannot connect to Supabase"

- Check Supabase URL dan Key benar
- Pastikan menggunakan **Service Role Key**, bukan anon key

### Error: "Callback failed"

- Pastikan Next.js container name benar di docker-compose
- Verify URL: `http://nextjs:3000/api/webhook/complete`
- Pastikan Next.js dan n8n dalam Docker network yang sama

## Customization

### Mengubah Chunk Size

Edit di node **"Code Chunking"**:

```javascript
const chunkSize = 1000; // ubah sesuai kebutuhan
const overlapSize = 200; // ubah overlap
```

### Mengubah Model OpenAI

Edit di node **"OpenAI Chat"**:

- Ganti `gpt-3.5-turbo` ke `gpt-4` untuk akurasi lebih tinggi
- Adjust `temperature` (0.1 - 1.0) untuk kreativitas

### Mengubah Jumlah Chunks Retrieved

Edit di node **"Supabase Vector Search"**:

```sql
... LIMIT 5  -- ubah angka sesuai kebutuhan
```

## Support

Untuk pertanyaan atau issues:

- Check n8n logs untuk error details
- Refer to [n8n-workflow-guide.md](../docs/n8n-workflow-guide.md) untuk detail lengkap
