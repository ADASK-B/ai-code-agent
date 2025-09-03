#!/bin/bash
# AI Code Agent - Complete System Startup Script
# Starts both Core Services and Monitoring Stack

set -e

echo "🚀 Starting AI Code Agent - Complete System"
echo "==========================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please copy .env.example to .env and configure your settings"
    exit 1
fi

echo "📋 Step 1: Stopping any existing containers..."
docker-compose -f ops/compose/docker-compose.yml down 2>/dev/null || true
docker-compose -f ops/monitoring/docker-compose.monitoring.yml down 2>/dev/null || true

echo "🔧 Step 2: Starting Core Services..."
docker-compose -f ops/compose/docker-compose.yml --env-file .env up -d --build

echo "📊 Step 3: Creating monitoring network..."
docker network create code-agent-network 2>/dev/null || echo "Network already exists"

echo "📈 Step 4: Starting Monitoring Services..."
docker-compose -f ops/monitoring/docker-compose.monitoring.yml up -d

echo "⏳ Step 5: Waiting for services to initialize (45 seconds)..."
sleep 45

echo "🏥 Step 6: Health Check..."
echo "========================="

# Core Services Health Check
echo "Core Application Services:"
curl -s -o /dev/null -w "✅ Traefik Dashboard: %{http_code}\n" http://localhost:8080 || echo "❌ Traefik: ERROR"
curl -s -o /dev/null -w "✅ Gateway: %{http_code}\n" http://localhost:3001/health || echo "❌ Gateway: ERROR"
curl -s -o /dev/null -w "✅ Adapter: %{http_code}\n" http://localhost:3002/health || echo "❌ Adapter: ERROR"
curl -s -o /dev/null -w "✅ LLM-Patch: %{http_code}\n" http://localhost:3003/health || echo "❌ LLM-Patch: ERROR"
curl -s -o /dev/null -w "✅ ngrok: %{http_code}\n" http://localhost:4040/api/tunnels || echo "❌ ngrok: ERROR"
docker logs agent-orchestrator --tail 2 | grep -q "Application started" && echo "✅ Orchestrator: Running" || echo "❌ Orchestrator: Error"
docker logs agent-azurite --tail 2 | grep -q "successfully listening" && echo "✅ Azurite: Running" || echo "❌ Azurite: Error"

echo ""
echo "Monitoring Services:"
curl -s -o /dev/null -w "✅ Grafana: %{http_code}\n" http://localhost:3000 || echo "❌ Grafana: ERROR"
curl -s -o /dev/null -w "✅ Prometheus: %{http_code}\n" http://localhost:9090 || echo "❌ Prometheus: ERROR"
curl -s -o /dev/null -w "✅ Node Exporter: %{http_code}\n" http://localhost:9100/metrics || echo "❌ Node Exporter: ERROR"
curl -s -o /dev/null -w "✅ cAdvisor: %{http_code}\n" http://localhost:8081/containers/ || echo "❌ cAdvisor: ERROR"

echo ""
echo "🎉 System Startup Complete!"
echo "=========================="
echo "📊 Grafana Dashboard: http://localhost:3000 (admin/admin123)"
echo "📈 Prometheus: http://localhost:9090"
echo "🔧 Traefik Dashboard: http://localhost:8080"
echo "🌐 ngrok Inspector: http://localhost:4040"
echo ""
echo "To get your public ngrok URL:"
echo "curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'"
