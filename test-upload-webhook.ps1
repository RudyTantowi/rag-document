# Test Upload Workflow
Write-Host "Testing Upload Webhook..." -ForegroundColor Cyan

$url = "https://nonrurally-nonrescissory-heaven.ngrok-free.dev/webhook/upload"

$body = @{
    file_id = "test-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    filename = "test-document.pdf"
    text = "This is a comprehensive test document for the RAG chatbot system. It contains information about artificial intelligence, machine learning, and natural language processing. AI is transforming how we interact with technology."
} | ConvertTo-Json

Write-Host "Sending request to: $url" -ForegroundColor Yellow
Write-Host "Body: $($body.Substring(0, 100))..." -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
    Write-Host "`nSuccess! Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "`nError:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}
