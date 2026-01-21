# RAG Chatbot with Next.js, n8n, and Supabase

Aplikasi chatbot berbasis RAG (Retrieval-Augmented Generation) yang memungkinkan user upload dokumen (PDF, DOC, DOCX, TXT, MD) dan chat dengan AI tentang konten dokumen tersebut.

## 🚀 Features

- ✅ Upload dokumen dengan drag & drop (max 10MB)
- ✅ Ekstraksi dan cleaning teks otomatis
- ✅ Real-time status tracking (Processing/Ready/Error)
- ✅ Chat interface dengan message history
- ✅ Dark/Light mode toggle
- ✅ Responsive design (mobile-friendly)
- ✅ Docker containerization
- ✅ Supabase database dengan RLS
- ✅ n8n workflow integration via Ngrok

## 🛠️ Tech Stack

- **Frontend & Backend:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Workflow Automation:** n8n
- **API Gateway:** Ngrok
- **Styling:** Tailwind CSS v4
- **Text Extraction:** pdf-parse, mammoth
- **Containerization:** Docker & Docker Compose

## 📦 Installation

### Prerequisites
- Docker & Docker Compose installed
- Supabase account & project created
- n8n container already running with name `n8n2`
- Ngrok gateway configured

### Step 1: Setup Environment

```bash
# Copy environment variables
cp .env.example .env

# Edit .env dengan credentials Anda
```

Isi `.env` dengan:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NGROK_BASE_URL=https://nonrurally-nonrescissory-heaven.ngrok-free.dev
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
```

### Step 2: Setup Supabase Database

1. Buka Supabase Dashboard → SQL Editor
2. Copy isi file `scripts/supabase-init.sql`
3. Execute SQL untuk create tables dan RLS policies

### Step 3: Setup n8n Workflows

Ikuti panduan lengkap di `docs/n8n-workflow-guide.md` untuk:
- Membuat workflow `/upload` untuk processing dokumen
- Membuat workflow `/chat` untuk chat dengan AI
- Konfigurasi webhooks dan credentials

### Step 4: Build & Run dengan Docker

```bash
# Install dependencies
npm install

# Build Docker image
docker build -t projectrag-nextjs .

# Run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f nextjs
```

Aplikasi akan berjalan di `http://localhost:3000`

## 🔧 Development Mode

Untuk development tanpa Docker:

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## 📖 Usage

### 1. Upload Dokumen
1. Buka aplikasi di browser
2. Drag & drop file atau klik area upload
3. Pilih file (PDF/DOC/DOCX/TXT/MD, max 10MB)
4. Tunggu status berubah dari "Memproses..." ke "Siap"

### 2. Chat dengan AI
1. Setelah file status "Siap", chat interface akan aktif
2. Ketik pertanyaan tentang dokumen
3. AI akan menjawab berdasarkan konten dokumen

## 🐛 Troubleshooting

### Upload Gagal
- Check file size tidak melebihi 10MB
- Pastikan format file didukung (PDF/DOC/DOCX/TXT/MD)
- Check logs: `docker-compose logs nextjs`

### Status Stuck di "Memproses"
- Check n8n workflow sudah aktif
- Verify ngrok gateway running
- Check n8n logs untuk errors
- Pastikan webhook callback URL benar

### Chat Tidak Berfungsi
- Pastikan ada file dengan status "Ready"
- Check n8n `/chat` endpoint accessible
- Verify OpenAI API key di n8n

## 📝 Documentation

- [n8n Workflow Setup Guide](docs/n8n-workflow-guide.md)
- [Supabase Schema](scripts/supabase-init.sql)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
