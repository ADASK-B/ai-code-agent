#!/usr/bin/env pwsh
# ngrok Setup Script mit Token aus .env

param(
    [switch]$Setup,
    [switch]$Start,
    [switch]$Stop,
    [switch]$Status
)

# Lade .env Datei
function Load-EnvFile {
    param($Path)
    
    if (Test-Path $Path) {
        Get-Content $Path | ForEach-Object {
            if ($_ -match '^([^#]+)=(.*)$') {
                $name = $matches[1].Trim()
                $value = $matches[2].Trim()
                if ($value -match '^"(.*)"$') {
                    $value = $matches[1]
                }
                [Environment]::SetEnvironmentVariable($name, $value, 'Process')
            }
        }
        Write-Host "✅ Loaded environment from $Path"
    } else {
        Write-Host "❌ Environment file not found: $Path"
        exit 1
    }
}

# Setup ngrok mit Token
function Setup-Ngrok {
    Write-Host "🔧 Setting up ngrok..."
    
    # Lade Token aus .env
    Load-EnvFile "ops/compose/.env"
    
    $token = $env:NGROK_AUTHTOKEN
    if (-not $token) {
        Write-Host "❌ NGROK_AUTHTOKEN not found in .env file!"
        exit 1
    }
    
    # Setze ngrok auth token
    try {
        ngrok config add-authtoken $token
        Write-Host "✅ ngrok auth token configured"
    } catch {
        Write-Host "❌ Failed to configure ngrok token: $_"
        exit 1
    }
    
    # Teste ngrok
    try {
        $version = ngrok version
        Write-Host "✅ ngrok ready: $version"
    } catch {
        Write-Host "❌ ngrok not installed or not in PATH"
        Write-Host "Download from: https://ngrok.com/download"
        exit 1
    }
}

# Starte ngrok Tunnel
function Start-Ngrok {
    Write-Host "🚀 Starting ngrok tunnel..."
    
    # Prüfe ob Gateway läuft
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ Gateway service is running"
    } catch {
        Write-Host "⚠️ Gateway service not reachable on port 3001"
        Write-Host "Start services first: docker compose up -d"
    }
    
    # Starte ngrok
    Write-Host "Starting ngrok tunnel to localhost:3001..."
    Start-Process -FilePath "ngrok" -ArgumentList "http", "3001", "--log=stdout" -NoNewWindow
    
    Start-Sleep -Seconds 3
    
    # Hole Public URL
    try {
        $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 5
        if ($tunnels.tunnels.Count -gt 0) {
            $publicUrl = $tunnels.tunnels[0].public_url
            Write-Host "🌐 Public URL: $publicUrl"
            Write-Host ""
            Write-Host "🎯 Webhook URLs:"
            Write-Host "   Azure DevOps: $publicUrl/gateway/webhook/ado"
            Write-Host ""
            Write-Host "📊 ngrok Dashboard: http://127.0.0.1:4040"
        } else {
            Write-Host "❌ No tunnels found"
        }
    } catch {
        Write-Host "⚠️ Could not get tunnel info (ngrok might still be starting...)"
        Write-Host "Check: http://127.0.0.1:4040"
    }
}

# Stoppe ngrok
function Stop-Ngrok {
    Write-Host "🛑 Stopping ngrok..."
    
    try {
        Get-Process | Where-Object {$_.ProcessName -like "*ngrok*"} | Stop-Process -Force
        Write-Host "✅ ngrok stopped"
    } catch {
        Write-Host "ℹ️ ngrok was not running"
    }
}

# Status anzeigen
function Show-Status {
    Write-Host "📊 ngrok Status:"
    Write-Host ""
    
    # Prüfe ngrok Prozess
    $ngrokProcess = Get-Process | Where-Object {$_.ProcessName -like "*ngrok*"}
    if ($ngrokProcess) {
        Write-Host "✅ ngrok process running (PID: $($ngrokProcess.Id))"
    } else {
        Write-Host "❌ ngrok process not running"
        return
    }
    
    # Prüfe API
    try {
        $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 5
        Write-Host "✅ ngrok API reachable"
        
        if ($tunnels.tunnels.Count -gt 0) {
            Write-Host ""
            Write-Host "🌐 Active Tunnels:"
            foreach ($tunnel in $tunnels.tunnels) {
                Write-Host "   $($tunnel.name): $($tunnel.public_url) -> $($tunnel.config.addr)"
            }
        } else {
            Write-Host "⚠️ No active tunnels"
        }
    } catch {
        Write-Host "❌ ngrok API not reachable"
    }
}

# Main
Write-Host "🔗 Code Agent MVP - ngrok Management"
Write-Host "===================================="

if ($Setup) {
    Setup-Ngrok
} elseif ($Start) {
    Start-Ngrok
} elseif ($Stop) {
    Stop-Ngrok
} elseif ($Status) {
    Show-Status
} else {
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\ngrok-setup.ps1 -Setup    # Configure ngrok with token"
    Write-Host "  .\ngrok-setup.ps1 -Start    # Start tunnel to gateway"
    Write-Host "  .\ngrok-setup.ps1 -Stop     # Stop ngrok"
    Write-Host "  .\ngrok-setup.ps1 -Status   # Show tunnel status"
    Write-Host ""
    Write-Host "Example workflow:"
    Write-Host "  1. .\ngrok-setup.ps1 -Setup"
    Write-Host "  2. docker compose up -d"
    Write-Host "  3. .\ngrok-setup.ps1 -Start"
}
