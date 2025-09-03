# AI Code Agent - Complete System Startup Script (PowerShell)
# Starts both Core Services and Monitoring Stack

param(
    [switch]$SkipHealthCheck
)

Write-Host "🚀 Starting AI Code Agent - Complete System" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and configure your settings" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Step 1: Stopping any existing containers..." -ForegroundColor Cyan
try {
    docker-compose -f ops/compose/docker-compose.yml down 2>$null
    docker-compose -f ops/monitoring/docker-compose.monitoring.yml down 2>$null
} catch {
    # Ignore errors if containers don't exist
}

Write-Host "🔧 Step 2: Starting Core Services..." -ForegroundColor Cyan
docker-compose -f ops/compose/docker-compose.yml --env-file .env up -d --build

Write-Host "📊 Step 3: Creating monitoring network..." -ForegroundColor Cyan
try {
    docker network create code-agent-network 2>$null
} catch {
    Write-Host "Network already exists" -ForegroundColor Gray
}

Write-Host "📈 Step 4: Starting Monitoring Services..." -ForegroundColor Cyan
docker-compose -f ops/monitoring/docker-compose.monitoring.yml up -d

Write-Host "⏳ Step 5: Waiting for services to initialize (45 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 45

if (-not $SkipHealthCheck) {
    Write-Host "🏥 Step 6: Health Check..." -ForegroundColor Cyan
    Write-Host "=========================" -ForegroundColor Cyan

    # Core Services Health Check
    Write-Host "Core Application Services:" -ForegroundColor Yellow
    try { $r = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing; Write-Host "✅ Traefik Dashboard: $($r.StatusCode)" -ForegroundColor Green } catch { Write-Host "❌ Traefik: ERROR" -ForegroundColor Red }
    try { $r = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing; Write-Host "✅ Gateway: $($r.StatusCode)" -ForegroundColor Green } catch { Write-Host "❌ Gateway: ERROR" -ForegroundColor Red }
    try { $r = Invoke-WebRequest -Uri "http://localhost:3002/health" -UseBasicParsing; Write-Host "✅ Adapter: $($r.StatusCode)" -ForegroundColor Green } catch { Write-Host "❌ Adapter: ERROR" -ForegroundColor Red }
    try { $r = Invoke-WebRequest -Uri "http://localhost:3003/health" -UseBasicParsing; Write-Host "✅ LLM-Patch: $($r.StatusCode)" -ForegroundColor Green } catch { Write-Host "❌ LLM-Patch: ERROR" -ForegroundColor Red }
    try { $r = Invoke-WebRequest -Uri "http://localhost:4040/api/tunnels" -UseBasicParsing; Write-Host "✅ ngrok: $($r.StatusCode)" -ForegroundColor Green } catch { Write-Host "❌ ngrok: ERROR" -ForegroundColor Red }
    if ((docker logs agent-orchestrator --tail 2) -match "Application started") { Write-Host "✅ Orchestrator: Running" -ForegroundColor Green } else { Write-Host "❌ Orchestrator: Error" -ForegroundColor Red }
    if ((docker logs agent-azurite --tail 2) -match "successfully listening") { Write-Host "✅ Azurite: Running" -ForegroundColor Green } else { Write-Host "❌ Azurite: Error" -ForegroundColor Red }

    Write-Host ""
    Write-Host "Monitoring Services:" -ForegroundColor Yellow
    try { $r = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing; Write-Host "✅ Grafana: $($r.StatusCode)" -ForegroundColor Green } catch { Write-Host "❌ Grafana: ERROR" -ForegroundColor Red }
    try { $r = Invoke-WebRequest -Uri "http://localhost:9090" -UseBasicParsing; Write-Host "✅ Prometheus: $($r.StatusCode)" -ForegroundColor Green } catch { Write-Host "❌ Prometheus: ERROR" -ForegroundColor Red }
    try { $r = Invoke-WebRequest -Uri "http://localhost:9100/metrics" -UseBasicParsing; Write-Host "✅ Node Exporter: $($r.StatusCode)" -ForegroundColor Green } catch { Write-Host "❌ Node Exporter: ERROR" -ForegroundColor Red }
    try { $r = Invoke-WebRequest -Uri "http://localhost:8081/containers/" -UseBasicParsing; Write-Host "✅ cAdvisor: $($r.StatusCode)" -ForegroundColor Green } catch { Write-Host "❌ cAdvisor: ERROR" -ForegroundColor Red }
}

Write-Host ""
Write-Host "🎉 System Startup Complete!" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green
Write-Host "📊 Grafana Dashboard: http://localhost:3000 (admin/admin123)" -ForegroundColor Cyan
Write-Host "📈 Prometheus: http://localhost:9090" -ForegroundColor Cyan
Write-Host "🔧 Traefik Dashboard: http://localhost:8080" -ForegroundColor Cyan
Write-Host "🌐 ngrok Inspector: http://localhost:4040" -ForegroundColor Cyan
Write-Host ""
Write-Host "To get your public ngrok URL:" -ForegroundColor White
Write-Host "try { `$tunnels = Invoke-WebRequest -Uri `"http://localhost:4040/api/tunnels`" | ConvertFrom-Json; Write-Host `$tunnels.tunnels[0].public_url } catch { `"Not available yet`" }" -ForegroundColor Gray
