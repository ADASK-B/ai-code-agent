# NGROK STABLE STARTUP SCRIPT
Write-Host "`n🔧 NGROK STARTUP SCRIPT" -ForegroundColor Green

# Kill existing ngrok processes
Write-Host "Stoppe alle ngrok Prozesse..." -ForegroundColor Yellow
taskkill /F /IM ngrok.exe 2>$null
Start-Sleep 3

# Clear any potential locks
Write-Host "Räume ngrok auf..." -ForegroundColor Yellow
$ngrokDir = "$env:LOCALAPPDATA\ngrok"
if (Test-Path "$ngrokDir\ngrok.lock") {
    Remove-Item "$ngrokDir\ngrok.lock" -Force -ErrorAction SilentlyContinue
}

Start-Sleep 2

# Start ngrok with retry logic
$maxRetries = 3
$retryCount = 0

while ($retryCount -lt $maxRetries) {
    Write-Host "`n🚀 Starte ngrok (Versuch $($retryCount + 1)/$maxRetries)..." -ForegroundColor Cyan
    
    # Start ngrok in background
    $ngrokProcess = Start-Process -FilePath "ngrok" -ArgumentList "http", "80", "--region", "eu" -PassThru -WindowStyle Hidden
    
    # Wait for startup
    Start-Sleep 8
    
    # Check if process is still running
    if (!$ngrokProcess.HasExited) {
        Write-Host "✅ ngrok gestartet! Prüfe Verbindung..." -ForegroundColor Green
        
        # Get the URL from ngrok API
        try {
            $ngrokInfo = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 5
            if ($ngrokInfo.tunnels.Count -gt 0) {
                $publicUrl = $ngrokInfo.tunnels[0].public_url
                Write-Host "`n✅ NGROK LÄUFT ERFOLGREICH!" -ForegroundColor Green
                Write-Host "`n📋 ADO WEBHOOK URL:" -ForegroundColor Yellow
                Write-Host "   $publicUrl/webhook/ado" -ForegroundColor Cyan
                Write-Host "`n🔄 Diese URL in ADO Service Hooks eintragen!" -ForegroundColor White
                break
            }
        }
        catch {
            Write-Host "❌ ngrok API nicht erreichbar" -ForegroundColor Red
        }
    }
    
    $retryCount++
    if ($retryCount -lt $maxRetries) {
        Write-Host "❌ Versuch fehlgeschlagen, starte neu..." -ForegroundColor Red
        taskkill /F /IM ngrok.exe 2>$null
        Start-Sleep 5
    }
}

if ($retryCount -eq $maxRetries) {
    Write-Host "`n❌ NGROK START FEHLGESCHLAGEN NACH $maxRetries VERSUCHEN" -ForegroundColor Red
    Write-Host "Versuche manuell: ngrok http 80" -ForegroundColor Yellow
}
