================================================================================
        RAG CHATBOT - DOCUMENT INTELLIGENCE SYSTEM
================================================================================

JUDUL PROTOTIPE:
RAG (Retrieval-Augmented Generation) Chatbot - Sistem Chat dengan Dokumen
menggunakan AI dan Vector Search

================================================================================
DESKRIPSI SINGKAT:
================================================================================

Aplikasi web berbasis Next.js yang memungkinkan pengguna untuk:
- Upload dokumen (PDF, DOCX, TXT, MD) maksimal 10MB
- Chat dengan AI tentang isi dokumen yang telah diupload
- Mendapatkan jawaban berbasis konteks dari dokumen menggunakan RAG

Sistem menggunakan arsitektur asynchronous processing dengan n8n untuk 
chunking, embedding, dan vector search di Supabase PostgreSQL.

FITUR UTAMA:
- Upload multiple dokumen dengan drag-and-drop
- Text extraction otomatis dengan pembersihan teks mendalam
- Vector embeddings untuk semantic search
- Chat interface real-time dengan streaming response
- Dark/Light mode theme
- Docker-based deployment

================================================================================
ARSITEKTUR SISTEM:
================================================================================

1. Next.js Frontend & API (Container 1)
   - React components untuk UI
   - API routes untuk upload, chat, files
   - Text extraction (PDF, DOCX, TXT, MD)
   - Port: 3000

2. n8n Workflow Automation (Container 2)
   - Webhook untuk document processing
   - Chunking dokumen (500 chars, overlap 50)
   - Generate embeddings (HuggingFace/OpenAI)
   - Vector search & RAG query
   - Port: 5678

3. Supabase (Cloud/Self-hosted)
   - PostgreSQL dengan pgvector extension
   - Vector database untuk embeddings
   - Tables: files, messages, document_chunks

4. Ngrok (Extension)
   - Expose n8n webhooks ke internet
   - Digunakan untuk callback dari n8n ke Next.js

================================================================================
CARA MENJALANKAN APLIKASI:
================================================================================

PRASYARAT:
----------
1. Docker & Docker Compose terinstall
2. n8n sudah running di Docker dengan network "n8n-network"
3. Supabase account (atau self-hosted Supabase)
4. Ngrok account (untuk expose n8n webhooks)
5. HuggingFace API token (untuk embeddings)

LANGKAH-LANGKAH:
----------------

STEP 1: Setup Environment Variables
------------------------------------
Buat file .env di root folder dengan isi berikut:

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# n8n Webhook (via Ngrok)
NGROK_BASE_URL=https://your-ngrok-id.ngrok-free.app

# Optional
NEXT_PUBLIC_MAX_FILE_SIZE=10485760

** PENTING: Ganti semua nilai di atas dengan credentials Anda sendiri! **


STEP 2: Setup Supabase Database
--------------------------------
1. Login ke Supabase Dashboard
2. Buka SQL Editor
3. Jalankan script: scripts/supabase-init.sql
   (Ini akan membuat tables dan pgvector extension)


STEP 3: Setup n8n Workflows
----------------------------
1. Pastikan n8n sudah running di Docker
2. Login ke n8n (http://localhost:5678)
3. Import workflows dari folder: n8n-workflows/
   - Workflow Upload: untuk process dokumen
   - Workflow Chat: untuk RAG query
4. Update credentials di n8n:
   - Supabase credentials (URL, service role key)
   - HuggingFace API token
   - Callback URL: http://projectrag-nextjs:3000/api/webhook/complete
5. Activate kedua workflows


STEP 4: Setup Ngrok untuk n8n
------------------------------
1. Install Ngrok: https://ngrok.com/download
2. Login: ngrok config add-authtoken YOUR_TOKEN
3. Expose n8n:
   ngrok http 5678
4. Copy URL ngrok (contoh: https://abc123.ngrok-free.app)
5. Update .env → NGROK_BASE_URL dengan URL tersebut


STEP 5: Jalankan Aplikasi dengan Docker
----------------------------------------
1. Build dan jalankan container:
   
   docker-compose up --build

2. Tunggu hingga container running (cek logs):
   
   docker-compose logs -f nextjs

3. Buka browser: http://localhost:3000

4. Selesai! Aplikasi siap digunakan.


STEP 6: Testing Upload & Chat
------------------------------
1. Upload file PDF/DOCX (max 10MB)
2. Tunggu status berubah dari "Processing" ke "Ready" (~30 detik)
3. Pilih file yang sudah ready
4. Mulai chat dengan pertanyaan tentang dokumen
5. AI akan menjawab berdasarkan konten dokumen


TROUBLESHOOTING:
----------------

Problem: Container tidak bisa connect ke n8n
Solution: Pastikan n8n-network sudah dibuat
  docker network create n8n-network

Problem: Upload file gagal "Processing" terus
Solution: 
  - Cek n8n workflow sudah active
  - Cek Ngrok masih running
  - Cek logs: docker-compose logs nextjs

Problem: Chat tidak mendapat response
Solution:
  - Cek file status = "ready" di Supabase
  - Cek n8n workflow chat sudah active
  - Pastikan document_chunks table ada data

Problem: "Failed to generate embeddings"
Solution:
  - Cek HuggingFace API token valid
  - Quota API belum habis
  - Network connection ke HuggingFace API


STOP APLIKASI:
--------------
docker-compose down

REBUILD (jika ada perubahan code):
-----------------------------------
docker-compose up --build --force-recreate


================================================================================
STRUKTUR PROJECT:
================================================================================

projectrag/
├── app/
│   ├── api/
│   │   ├── upload/route.ts       # Upload & extract text
│   │   ├── chat/route.ts         # RAG chat query
│   │   ├── files/route.ts        # List uploaded files
│   │   └── webhook/complete/     # Callback from n8n
│   ├── components/
│   │   ├── FileUpload.tsx        # Drag-drop upload UI
│   │   ├── ChatInterface.tsx     # Chat messages UI
│   │   └── ThemeToggle.tsx       # Dark/light mode
│   ├── page.tsx                  # Main page
│   └── globals.css               # Tailwind styles
├── lib/
│   ├── supabase.ts               # Supabase clients
│   └── textExtractor.ts          # PDF/DOCX/TXT parser
├── scripts/
│   └── supabase-init.sql         # Database schema
├── n8n-workflows/                # Import ke n8n
├── docker-compose.yml            # Docker orchestration
├── Dockerfile                    # Next.js container
├── .env                          # Environment variables (BUAT SENDIRI!)
├── package.json                  # Dependencies
└── README.txt                    # File ini

================================================================================
TEKNOLOGI YANG DIGUNAKAN:
================================================================================

Frontend:
- Next.js 16 (React 19)
- TypeScript
- Tailwind CSS
- Supabase Client

Backend:
- Next.js API Routes
- n8n (workflow automation)
- Supabase PostgreSQL + pgvector
- HuggingFace API (embeddings)
- OpenAI API (alternative)

Libraries:
- pdf-parse (PDF extraction)
- mammoth (DOCX extraction)
- formidable (file upload)
- uuid (unique IDs)

Infrastructure:
- Docker & Docker Compose
- Ngrok (tunnel)
- Supabase (BaaS)

================================================================================
KEAMANAN & BEST PRACTICES:
================================================================================

1. Jangan commit file .env ke Git (sudah di .gitignore)
2. Gunakan SUPABASE_SERVICE_ROLE_KEY hanya di server-side API
3. Maksimal file size 10MB (bisa diubah di .env)
4. Text cleaning otomatis untuk remove gibberish
5. RLS (Row Level Security) di Supabase untuk production
6. Rate limiting di n8n webhooks (production)

================================================================================
DOKUMENTASI LENGKAP:
================================================================================

Lihat file berikut untuk detail lebih lanjut:
- DOCUMENTATION.md         - Dokumentasi lengkap arsitektur
- docs/n8n-workflow-guide.md - Setup n8n workflows detail
- docs/GEMINI-SETUP.md     - Alternative AI provider (Google Gemini)
- n8n-workflows/HUGGINGFACE-SETUP.md - HuggingFace embeddings config

================================================================================
CONTACT & SUPPORT:
================================================================================

Repository: https://github.com/RudyTantowi/rag-document
Author: Rudy Tantowi
Email: rudy.phan04@gmail.com

Untuk bug reports dan feature requests, silakan buat issue di GitHub.

================================================================================
VERSION: 1.0.0
LAST UPDATED: 31 Januari 2026
================================================================================
