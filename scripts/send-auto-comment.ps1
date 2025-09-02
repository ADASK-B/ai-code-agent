# Auto-Increment ADO Comment Sender
param(
    [int]$ReadmeNumber = 4  # Start with README4
)

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

$commentText = "@AICodingAgent /edit /1 Add Hello World to README$ReadmeNumber"

$body = @{
    comments = @(
        @{
            parentCommentId = 0
            content = $commentText
            commentType = "text"
        }
    )
} | ConvertTo-Json -Depth 3

Write-Host "🚀 Sende Auto-Increment Comment: $commentText" -ForegroundColor Green

try {
    $response = Invoke-RestMethod -Uri "https://dev.azure.com/Arthur-Schwan/AIAgentProject/_apis/git/repositories/AIAgentProject/pullRequests/3/threads?api-version=6.0" -Method POST -Headers $headers -Body $body
    Write-Host "✅ Comment erfolgreich gesendet!" -ForegroundColor Green
    Write-Host "Thread ID: $($response.id)" -ForegroundColor Cyan
    Write-Host "Nächster Aufruf: .\send-auto-comment.ps1 -ReadmeNumber $($ReadmeNumber + 1)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Fehler beim Senden des Comments:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
}
