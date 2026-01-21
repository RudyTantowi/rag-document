# Test RAG Chat Workflow
# Make sure you have uploaded a file first and it's status is "ready"

$webhookUrl = "https://nonrurally-nonrescissory-heaven.ngrok-free.dev/webhook/chat"

# Get a file_id from your uploaded files
# You can check at: https://supabase.com/dashboard/project/ankdhneeohlknstgloyy/editor
# Or use this to get from API:
Write-Host "Getting uploaded files..." -ForegroundColor Yellow
$filesResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/files" -Method Get
$readyFiles = $filesResponse.files | Where-Object { $_.status -eq "ready" }

if ($readyFiles.Count -eq 0) {
    Write-Host "❌ No ready files found. Please upload a file first!" -ForegroundColor Red
    exit
}

$file = $readyFiles[0]
Write-Host "✅ Found ready file: $($file.filename) (ID: $($file.file_id))" -ForegroundColor Green

# Test chat with the file
$testMessage = "Apa isi dari dokumen ini?"

Write-Host "`nSending chat request..." -ForegroundColor Yellow
Write-Host "File ID: $($file.file_id)" -ForegroundColor Cyan
Write-Host "Message: $testMessage" -ForegroundColor Cyan

$body = @{
    message = $testMessage
    file_id = $file.file_id
} | ConvertTo-Json

Write-Host "`nRequest body:" -ForegroundColor Gray
Write-Host $body -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "`n✅ Chat workflow successful!" -ForegroundColor Green
    Write-Host "`nAI Response:" -ForegroundColor Cyan
    Write-Host $response.message -ForegroundColor White
    Write-Host "`nMetadata:" -ForegroundColor Gray
    Write-Host "Chunks used: $($response.chunks_used)" -ForegroundColor Gray
    Write-Host "Model: $($response.model)" -ForegroundColor Gray
    Write-Host "Question: $($response.original_question)" -ForegroundColor Gray
    
} catch {
    Write-Host "`n❌ Error calling chat webhook:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nResponse:" -ForegroundColor Yellow
    Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
}
