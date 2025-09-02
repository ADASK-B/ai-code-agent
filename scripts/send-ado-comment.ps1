# ADO Comment Sender Script
$token = $env:AZURE_DEVOPS_PAT
if (-not $token) {
    Write-Error "AZURE_DEVOPS_PAT environment variable not set!"
    exit 1
}
$encodedToken = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes(":$token"))

$headers = @{
    "Authorization" = "Basic $encodedToken"
    "Content-Type" = "application/json"
}

$body = @{
    comments = @(
        @{
            parentCommentId = 0
            content = "@AICodingAgent /edit /1 Add Hello World to README3"
            commentType = "text"
        }
    )
} | ConvertTo-Json -Depth 3

Write-Host "🚀 Sende Comment an ADO Pull Request #3..." -ForegroundColor Green

try {
    $response = Invoke-RestMethod -Uri "https://dev.azure.com/Arthur-Schwan/AIAgentProject/_apis/git/repositories/AIAgentProject/pullRequests/3/threads?api-version=6.0" -Method POST -Headers $headers -Body $body
    Write-Host "✅ Comment erfolgreich gesendet!" -ForegroundColor Green
    Write-Host "Thread ID: $($response.id)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Fehler beim Senden des Comments:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
    
    # Versuche alternative API
    Write-Host "`nVersuche alternative API..." -ForegroundColor Yellow
    $simpleBody = @{
        content = "@AICodingAgent /edit /1 Add Hello World to README3"
    } | ConvertTo-Json
    
    try {
        $response2 = Invoke-RestMethod -Uri "https://dev.azure.com/Arthur-Schwan/AIAgentProject/_apis/git/repositories/AIAgentProject/pullRequests/3/threads?api-version=7.0" -Method POST -Headers $headers -Body $simpleBody
        Write-Host "✅ Alternative API erfolgreich!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Auch alternative API fehlgeschlagen:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Yellow
    }
}
