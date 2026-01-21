# RAG Chatbot - AI Agent Instructions

## Project Overview
This is a RAG (Retrieval-Augmented Generation) chatbot built with Next.js 16 that allows users to upload documents and chat with AI about their content. The system uses **asynchronous processing** via n8n workflows with vector embeddings for semantic search.

## Architecture Pattern: Async Processing Pipeline

The application follows a **fire-and-forget** pattern for document processing:

```
Next.js Upload → n8n Webhook → Chunking/Embeddings → Supabase Vector DB → Status Update
```

Key files:
- [app/api/upload/route.ts](app/api/upload/route.ts) - Uploads file, extracts text, sends to n8n (async)
- [app/api/chat/route.ts](app/api/chat/route.ts) - Queries n8n for RAG-based responses
- [app/api/webhook/complete/route.ts](app/api/webhook/complete/route.ts) - Callback from n8n to update status

**Critical**: The upload endpoint returns immediately with `status: "processing"`. n8n processes the document asynchronously and calls the `/webhook/complete` endpoint when done to update status to `ready`.

## External Dependencies

### n8n Workflows (via Ngrok Gateway)
- `NGROK_BASE_URL` environment variable points to n8n instance
- `/webhook/upload` - Receives extracted text, performs chunking & embeddings
- `/webhook/chat` - Performs vector search and generates AI responses
- Workflows must be imported from [n8n-workflows/](n8n-workflows/) directory
- See [docs/n8n-workflow-guide.md](docs/n8n-workflow-guide.md) for setup

### Supabase Database
- Uses **both** `supabaseAdmin` (service role) and `supabase` (anon) clients from [lib/supabase.ts](lib/supabase.ts)
- Server-side API routes use `supabaseAdmin` to bypass RLS policies
- Three main tables: `files`, `messages`, `document_chunks` (with vector embeddings)
- Initialize with [scripts/supabase-init.sql](scripts/supabase-init.sql)

## Text Processing Convention

The [lib/textExtractor.ts](lib/textExtractor.ts) module implements aggressive text cleaning via `deepCleanText()`:
- Removes page numbers, headers/footers, URLs, emails
- Filters out lines with repetitive characters (gibberish detection)
- Preserves only lines with >40% letters
- Always pass extracted text through `deepCleanText()` before sending to n8n

Supported formats: PDF (pdf-parse), DOCX (mammoth), TXT, MD - max 10MB per file.

## Development Workflows

### Running Locally (Development)
```powershell
npm install
npm run dev  # Runs on http://localhost:3000
```

### Docker Deployment
```powershell
docker-compose up -d  # Connects to external n8n-network
docker-compose logs -f nextjs
```

The app **must** connect to n8n's Docker network for internal callbacks. See [docker-compose.yml](docker-compose.yml) - uses external network `n8n-network`.

### Testing n8n Webhooks
Use PowerShell test scripts:
- [test-chat-webhook.ps1](test-chat-webhook.ps1) - Test chat endpoint
- [test-upload-webhook.ps1](test-upload-webhook.ps1) - Test upload processing
- JSON payloads in [test-chat.json](test-chat.json) and [test-upload.json](test-upload.json)

## Database Schema Patterns

File status lifecycle: `processing` → `ready` (or `error`)

```typescript
// Always check file status before enabling chat
const { data: readyFiles } = await supabaseAdmin
  .from("files")
  .select("file_id")
  .eq("status", "ready");
```

Messages table uses `file_id` FK with cascade delete. Always save both user and assistant messages for chat history.

## Component Architecture

- [app/components/FileUpload.tsx](app/components/FileUpload.tsx) - Drag-and-drop with client-side validation
- [app/components/ChatInterface.tsx](app/components/ChatInterface.tsx) - Displays messages with auto-scroll
- [app/components/ThemeToggle.tsx](app/components/ThemeToggle.tsx) - Dark/light mode switcher

Components use **"use client"** directive (Next.js 16 App Router pattern). Server components in `app/page.tsx` handle data fetching.

## Environment Variables

Required `.env` variables:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NGROK_BASE_URL=https://your-ngrok-url.ngrok-free.dev
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
```

**Critical**: n8n workflows need matching Supabase credentials and must be configured to call back to `http://projectrag-nextjs:3000/api/webhook/complete` (Docker internal hostname).

## Common Pitfalls

1. **Forgetting async nature**: Upload endpoint doesn't wait for processing. Frontend must poll file status or use real-time subscriptions.
2. **Wrong Supabase client**: Use `supabaseAdmin` in API routes, not `supabase` (anon client bypasses RLS).
3. **Network isolation**: n8n and Next.js must be on same Docker network for callbacks.
4. **Text extraction errors**: Always wrap `extractText()` in try-catch and update file status to `error` on failure.
5. **Vector dimensions**: HuggingFace embeddings use 384 dimensions (see [scripts/supabase-init.sql](scripts/supabase-init.sql) L34), OpenAI uses 1536.

## Key References

- [README.md](README.md) - Setup instructions and features
- [docs/GEMINI-SETUP.md](docs/GEMINI-SETUP.md) - Alternative AI provider setup
- [n8n-workflows/HUGGINGFACE-SETUP.md](n8n-workflows/HUGGINGFACE-SETUP.md) - HuggingFace embeddings configuration
- [docs/n8n-workflow-guide.md](docs/n8n-workflow-guide.md) - Complete n8n workflow setup guide
