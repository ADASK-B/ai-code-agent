# Troubleshooting Guide

**Author:** Arthur Schwan  
**Last Updated:** September 11, 2025  
**Status:** Production-Ready

## 🔧 Quick Diagnosis

### System Health Check
```powershell
# Check all services status
docker-compose -f docker-compose.full.yml ps

# View health dashboard
# Open http://localhost:8888 in browser

# Check critical services
curl http://localhost:3001/health  # Gateway
curl http://localhost:3002/health  # Adapter
curl http://localhost:3003/health  # LLM-Patch
```

## 🚨 Common Issues

### 1. Services Won't Start

#### Issue: Docker containers failing to start
```powershell
# Check container logs
docker-compose -f docker-compose.full.yml logs

# Check specific service
docker-compose -f docker-compose.full.yml logs agent-gateway

# Common solutions
docker-compose -f docker-compose.full.yml down; docker-compose -f docker-compose.full.yml up -d --build
```

#### Issue: Port conflicts
```powershell
# Check what's using ports
netstat -ano | findstr :3001
netstat -ano | findstr :8080

# Kill process if needed
taskkill /PID <process_id> /F
```

### 2. LLM Service Issues

#### Issue: Ollama model not downloading
```powershell
# Check Ollama logs
docker-compose -f docker-compose.full.yml logs agent-ollama

# Manual model pull
docker-compose -f docker-compose.full.yml exec agent-ollama ollama pull llama3.1:8b

# Switch to smaller model if memory issues
# Edit docker-compose.full.yml, change to llama3.1:1b
```

#### Issue: LLM generation timeouts
```powershell
# Check LLM-Patch service logs
docker-compose -f docker-compose.full.yml logs agent-llm-patch

# Test LLM directly
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3.1:8b","prompt":"Hello","stream":false}'
```

### 3. Azure DevOps Integration

#### Issue: Webhook not receiving events
```powershell
# Check ngrok status (if enabled)
curl http://localhost:4040/api/tunnels

# Check gateway logs for webhook events
docker-compose -f docker-compose.full.yml logs agent-gateway | grep webhook

# Verify ADO webhook configuration
# - URL should point to ngrok tunnel: https://xyz.ngrok.io/webhook/ado
# - Content type: application/json
# - Events: Pull request created, updated
```

#### Issue: Authentication failures
```powershell
# Check environment variables
docker-compose -f docker-compose.full.yml exec agent-adapter env | grep AZDO

# Test ADO connection
docker-compose -f docker-compose.full.yml exec agent-adapter node -e "
const pat = process.env.AZDO_PAT;
console.log('PAT configured:', !!pat);
console.log('PAT length:', pat ? pat.length : 0);
"
```

### 4. Memory and Performance Issues

#### Issue: High memory usage
```powershell
# Check memory usage by service
docker stats --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Restart memory-heavy services
docker-compose -f docker-compose.full.yml restart agent-ollama
docker-compose -f docker-compose.full.yml restart agent-llm-patch

# Switch to smaller LLM model
# Edit OLLAMA_MODEL in .env to llama3.1:1b
```

#### Issue: Slow PR processing
```powershell
# Check processing pipeline logs
docker-compose -f docker-compose.full.yml logs agent-orchestrator
docker-compose -f docker-compose.full.yml logs agent-llm-patch

# Monitor response times
curl -w "%{time_total}\n" -o /dev/null -s http://localhost:3001/ready
```

## 🔍 Advanced Diagnostics

### Service Communication Issues

#### Check internal networking
```powershell
# Test service-to-service communication
docker-compose -f docker-compose.full.yml exec agent-gateway curl http://agent-orchestrator:7071/ready
docker-compose -f docker-compose.full.yml exec agent-adapter curl http://agent-llm-patch:3003/health
```

#### Verify load balancer (Traefik)
```powershell
# Check Traefik dashboard
# Open http://localhost:8080 in browser

# Test routing
curl -H "Host: gateway.localhost" http://localhost/health
```

### Database and Storage Issues

#### Azure Functions storage (Azurite)
```powershell
# Check Azurite logs
docker-compose -f docker-compose.full.yml logs azurite

# Test storage connection
curl http://localhost:10000/devstoreaccount1?comp=list
```

### Monitoring Stack Issues

#### Prometheus not scraping
```powershell
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify service metrics endpoints
curl http://localhost:3001/metrics
curl http://localhost:3002/metrics
curl http://localhost:3003/metrics
```

#### Grafana dashboard issues
```powershell
# Check Grafana logs
docker-compose -f docker-compose.full.yml logs grafana

# Reset Grafana (if needed)
docker-compose -f docker-compose.full.yml down
docker volume rm ai-code-agent_grafana_data
docker-compose -f docker-compose.full.yml up -d
```

## 🚀 Performance Optimization

### Resource Allocation

#### Optimize for development
```yaml
# In docker-compose.full.yml, add resource limits
services:
  agent-ollama:
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G
```

#### Scale down for testing
```powershell
# Disable monitoring stack temporarily
docker-compose -f docker-compose.dev.yml up -d

# Or disable specific services
docker-compose -f docker-compose.full.yml up -d --scale prometheus=0 --scale grafana=0
```

### Network Optimization

#### Use host networking for development
```yaml
# Add to service configuration
network_mode: host
```

## 📋 Environment Validation

### Complete Environment Check
```powershell
# Create validation script
$validation = @"
# Check required files
if (!(Test-Path ".env")) { Write-Host "ERROR: .env file missing" -ForegroundColor Red }
if (!(Test-Path "docker-compose.full.yml")) { Write-Host "ERROR: docker-compose.full.yml missing" -ForegroundColor Red }

# Check Docker
docker --version
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Docker not available" -ForegroundColor Red }

# Check ports
$ports = @(80, 3001, 3002, 3003, 7071, 8080, 9090, 3000, 8888, 11434)
foreach ($port in $ports) {
    $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet
    if ($connection) {
        Write-Host "WARNING: Port $port already in use" -ForegroundColor Yellow
    }
}

Write-Host "Environment validation complete" -ForegroundColor Green
"@

$validation | Out-File -FilePath validate-env.ps1
.\validate-env.ps1
```

## 🔄 Recovery Procedures

### Complete System Reset
```powershell
# Nuclear option: complete reset
docker-compose -f docker-compose.full.yml down -v
docker system prune -f
docker volume prune -f

# Rebuild everything
docker-compose -f docker-compose.full.yml up -d --build
```

### Graceful Service Restart
```powershell
# Restart in dependency order
docker-compose -f docker-compose.full.yml restart azurite
docker-compose -f docker-compose.full.yml restart agent-ollama
docker-compose -f docker-compose.full.yml restart agent-llm-patch
docker-compose -f docker-compose.full.yml restart agent-adapter
docker-compose -f docker-compose.full.yml restart agent-orchestrator
docker-compose -f docker-compose.full.yml restart agent-gateway
docker-compose -f docker-compose.full.yml restart traefik
```

### Backup Critical Data
```powershell
# Backup volumes before reset
docker run --rm -v ai-code-agent_grafana_data:/data -v ${PWD}:/backup alpine tar czf /backup/grafana-backup.tar.gz -C /data .
docker run --rm -v ai-code-agent_prometheus_data:/data -v ${PWD}:/backup alpine tar czf /backup/prometheus-backup.tar.gz -C /data .
```

## 📞 Getting Help

### Log Collection for Support
```powershell
# Collect all logs
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
docker-compose -f docker-compose.full.yml logs > "logs-$timestamp.txt"

# System information
docker-compose -f docker-compose.full.yml ps > "services-$timestamp.txt"
docker system df > "docker-info-$timestamp.txt"
```

### Community Resources
- **GitHub Issues:** [ai-code-agent/issues](https://github.com/arthur-schwan/ai-code-agent/issues)
- **Documentation:** [Full documentation](../README.md)
- **Architecture:** [System Architecture](system-architecture.md)

---

**Need more help?** Check the [Monitoring Guide](system-monitoring.md) for detailed health checking procedures.
