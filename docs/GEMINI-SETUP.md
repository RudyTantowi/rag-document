# Setup Google Gemini API (Gratis!)

## Kenapa Gemini?

- ✅ **Gratis 100% untuk personal use**
- ✅ 15 requests per minute (RPM)
- ✅ 1 million tokens per minute (TPM)
- ✅ Model: Gemini 1.5 Flash (fast & efficient)

## Cara Daftar API Key

### 1. Buka Google AI Studio

https://aistudio.google.com/app/apikey

### 2. Login dengan Google Account

- Pilih account Google Anda
- Tidak perlu payment method ❌💳

### 3. Generate API Key

- Klik **"Create API Key"**
- Pilih project (atau buat project baru)
- Copy API key yang muncul

Format API key: `AIzaSy...` (39 karakter)

### 4. Setup di n8n

1. **Import workflow** `rag-chat-workflow-simple.json` ke n8n
2. **Buka node "Gemini Chat"**
3. **Setup Credential:**
   - Type: `HTTP Header Auth`
   - Name: `Google Gemini API`
   - Header Name: `x-goog-api-key`
   - Header Value: `AIzaSy...` (paste API key Anda)
4. **Save credential**

### 5. Test Workflow

Run PowerShell script:

```powershell
.\scripts\test-chat-workflow-simple.ps1
```

## Gemini API Details

**Endpoint:**

```
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
```

**Request Format:**

```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Your prompt here"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.3,
    "maxOutputTokens": 1000
  }
}
```

**Response Format:**

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "AI response here"
          }
        ]
      }
    }
  ]
}
```

## Free Tier Limits

| Metric              | Limit       |
| ------------------- | ----------- |
| Requests per minute | 15 RPM      |
| Tokens per minute   | 1M TPM      |
| Tokens per day      | Unlimited   |
| Cost                | **FREE** 🎉 |

## Troubleshooting

### Error: API key not valid

- Cek API key sudah benar (39 karakter)
- Pastikan header name: `x-goog-api-key` (bukan `Authorization`)

### Error: Resource exhausted

- Tunggu 1 menit (hit rate limit)
- Free tier: 15 requests per minute

### Error: Permission denied

- Pastikan API key sudah enable di Google Cloud Console
- Cek project sudah aktif

## Links

- Google AI Studio: https://aistudio.google.com
- Documentation: https://ai.google.dev/docs
- Pricing: https://ai.google.dev/pricing (FREE tier!)
