# Panduan Setup n8n Workflow

## Deskripsi
Dokumentasi ini menjelaskan bagaimana mengkonfigurasi workflow n8n untuk RAG Chatbot. Workflow ini menerima file yang sudah diekstrak teksnya dari Next.js, melakukan chunking, embedding, dan menyimpannya untuk kemudian digunakan dalam chat.

## Prerequisites
- n8n sudah terinstall dan berjalan di Docker
- Ngrok gateway sudah dikonfigurasi
- Supabase database sudah dibuat

## Endpoints yang Harus Dibuat di n8n

### 1. Endpoint `/upload` - Upload & Proses Dokumen

**Method:** POST  
**URL:** `https://nonrurally-nonrescissory-heaven.ngrok-free.dev/upload`

#### Request Body (dari Next.js):
```json
{
  "file_id": "uuid-string",
  "filename": "document.pdf",
  "text": "cleaned text content from the document..."
}
```

#### Workflow Steps:
1. **Webhook Node** - Terima request dari Next.js
2. **Code Node** - Chunking text (split menjadi chunks 500-1000 tokens)
   ```javascript
   // Example chunking logic
   const text = $input.item.json.text;
   const chunkSize = 1000;
   const chunks = [];
   
   for (let i = 0; i < text.length; i += chunkSize) {
     chunks.push({
       file_id: $input.item.json.file_id,
       chunk_index: Math.floor(i / chunkSize),
       text: text.substring(i, i + chunkSize)
     });
   }
   
   return chunks.map(chunk => ({ json: chunk }));
   ```

3. **OpenAI/Embeddings Node** - Generate embeddings untuk setiap chunk
4. **Vector Store Node** - Simpan chunks + embeddings ke vector database (Pinecone/Weaviate/Supabase Vector)
5. **HTTP Request Node** - Callback ke Next.js webhook ketika selesai
   - URL: `http://nextjs:3000/api/webhook/complete` (internal Docker network)
   - Method: POST
   - Body:
     ```json
     {
       "file_id": "{{$json.file_id}}",
       "status": "ready"
     }
     ```

#### Response ke Next.js:
```json
{
  "message": "File processing started"
}
```

---

### 2. Endpoint `/chat` - Chat dengan AI

**Method:** POST  
**URL:** `https://nonrurally-nonrescissory-heaven.ngrok-free.dev/chat`

#### Request Body (dari Next.js):
```json
{
  "message": "User question about the document",
  "file_id": "uuid-string"
}
```

#### Workflow Steps:
1. **Webhook Node** - Terima request chat dari Next.js
2. **OpenAI/Embeddings Node** - Generate embedding dari user message
3. **Vector Store Retriever Node** - Search similarity dengan chunks yang tersimpan
   - Filter by file_id
   - Return top 3-5 most relevant chunks
4. **Code Node** - Format context untuk prompt
   ```javascript
   const chunks = $input.all().map(item => item.json.text);
   const context = chunks.join('\n\n');
   const userMessage = $('Webhook').item.json.message;
   
   return [{
     json: {
       prompt: `Context dari dokumen:\n${context}\n\nPertanyaan: ${userMessage}\n\nJawab berdasarkan context di atas:`
     }
   }];
   ```
5. **OpenAI Chat Node** - Generate response
   - Model: gpt-3.5-turbo atau gpt-4
   - Temperature: 0.3
   - System prompt: "Anda adalah asisten yang menjawab pertanyaan berdasarkan dokumen yang diberikan."
6. **Respond to Webhook Node** - Return response

#### Response ke Next.js:
```json
{
  "message": "AI generated response based on the document context"
}
```

---

## Setup Instructions

### Step 1: Buat Workflow Upload
1. Buka n8n editor
2. Buat workflow baru: "RAG Upload"
3. Tambahkan Webhook node:
   - Path: `/upload`
   - Method: POST
4. Tambahkan nodes sesuai workflow steps di atas
5. Konfigurasikan credentials (OpenAI API key, Vector DB credentials)
6. Aktifkan workflow

### Step 2: Buat Workflow Chat
1. Buat workflow baru: "RAG Chat"
2. Tambahkan Webhook node:
   - Path: `/chat`
   - Method: POST
3. Tambahkan nodes sesuai workflow steps di atas
4. Konfigurasikan credentials
5. Aktifkan workflow

### Step 3: Test Connection
Test endpoints dengan curl atau Postman:

```bash
# Test upload endpoint
curl -X POST https://nonrurally-nonrescissory-heaven.ngrok-free.dev/upload \
  -H "Content-Type: application/json" \
  -d '{
    "file_id": "test-123",
    "filename": "test.pdf",
    "text": "This is a test document content."
  }'

# Test chat endpoint
curl -X POST https://nonrurally-nonrescissory-heaven.ngrok-free.dev/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is this document about?",
    "file_id": "test-123"
  }'
```

---

## Environment Variables untuk n8n

Pastikan environment variables ini sudah dikonfigurasi di n8n Docker container:

```env
# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key

# Vector Database (pilih salah satu)
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=your-environment
PINECONE_INDEX=your-index-name

# atau Supabase Vector
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key

# Next.js Webhook URL (internal Docker network)
NEXTJS_WEBHOOK_URL=http://nextjs:3000/api/webhook/complete
```

---

## Troubleshooting

### Issue: Webhook tidak menerima request
- Pastikan ngrok gateway sudah berjalan
- Check n8n workflow sudah diaktifkan
- Verify webhook path correct (`/upload` dan `/chat`)

### Issue: Callback ke Next.js gagal
- Pastikan Next.js container dalam network Docker yang sama dengan n8n
- Check container name benar (`nextjs` di docker-compose.yml)
- Gunakan internal Docker URL: `http://nextjs:3000/api/webhook/complete`

### Issue: Embeddings gagal
- Verify OpenAI API key valid
- Check quota API tidak habis
- Pastikan text chunks tidak terlalu besar (max 8000 tokens)

### Issue: Vector search tidak return results
- Pastikan chunking dan embedding berhasil disimpan
- Check file_id filter benar
- Verify vector database connection

---

## Best Practices

1. **Chunking Strategy:**
   - Chunk size: 500-1000 tokens
   - Overlap: 100-200 tokens untuk context continuity
   - Clean text sebelum chunking (sudah dilakukan di Next.js)

2. **Embedding Model:**
   - Gunakan `text-embedding-ada-002` untuk cost-effective
   - Atau `text-embedding-3-small` untuk performa lebih baik

3. **Chat Model:**
   - `gpt-3.5-turbo` untuk kecepatan dan cost
   - `gpt-4` untuk akurasi lebih tinggi
   - Temperature: 0.3-0.5 untuk konsistensi

4. **Error Handling:**
   - Tambahkan error handling nodes
   - Log errors untuk debugging
   - Return error status ke Next.js jika processing gagal

5. **Performance:**
   - Cache embeddings jika possible
   - Limit number of chunks retrieved (3-5 chunks)
   - Set timeout untuk long-running operations

---

## Alternative: Simple Implementation tanpa Vector DB

Jika tidak ingin menggunakan vector database, bisa simplified:

### Simplified Upload Workflow:
1. Webhook receive text
2. Simpan text langsung ke Supabase table `document_chunks`
3. Callback ke Next.js

### Simplified Chat Workflow:
1. Webhook receive message
2. Ambil semua text chunks dari Supabase (filter by file_id)
3. Combine sebagai context
4. Send ke OpenAI Chat
5. Return response

**Note:** Approach ini tidak efisien untuk dokumen besar, tapi lebih simple untuk implement.

---

## Kontak & Support

Untuk pertanyaan lebih lanjut tentang setup n8n workflow, silakan refer ke:
- n8n Documentation: https://docs.n8n.io
- OpenAI API Docs: https://platform.openai.com/docs
- Supabase Vector Docs: https://supabase.com/docs/guides/ai
