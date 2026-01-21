# Test Chat Workflow
Write-Host "Testing Chat Webhook..." -ForegroundColor Cyan

$url = "https://nonrurally-nonrescissory-heaven.ngrok-free.dev/webhook/chat"

$body = @{
    file_id = "test-123-abc"
    message = "What is this document about?"
} | ConvertTo-Json

Write-Host "Sending request to: $url" -ForegroundColor Yellow
Write-Host "Body: $body" -ForegroundColor Gray

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
