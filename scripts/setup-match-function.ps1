# Run this script to create the match_documents function in Supabase
# This is required for the chat workflow to perform vector similarity search

$supabaseUrl = "https://ankdhneeohlknstgloyy.supabase.co"
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2RobmVlb2hsa25zdGdsb3l5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzE3Nzg0MCwiZXhwIjoyMDUyNzUzODQwfQ.m3DVGNSsN9iY5uqOBcMfLuiJuFV8o91fwJjIlWPJxAc"

# Read the SQL file
$sql = Get-Content -Path ".\scripts\create-match-documents-function.sql" -Raw

Write-Host "Creating match_documents function in Supabase..." -ForegroundColor Yellow

# Execute SQL via Supabase REST API
$body = @{
    query = $sql
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method Post -Headers @{
        "apikey" = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
        "Content-Type" = "application/json"
    } -Body $body
    
    Write-Host "✅ Function created successfully!" -ForegroundColor Green
    Write-Host $response | ConvertTo-Json -Depth 10
} catch {
    # Try alternative method - direct SQL execution
    Write-Host "Alternative method: Execute this SQL manually in Supabase SQL Editor:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host $sql -ForegroundColor White
    Write-Host ""
    Write-Host "Go to: https://supabase.com/dashboard/project/ankdhneeohlknstgloyy/sql/new" -ForegroundColor Cyan
}
