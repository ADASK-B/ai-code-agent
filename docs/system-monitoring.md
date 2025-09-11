# System Monitoring

**Author:** Arthur Schwan  
**Last Updated:** September 11, 2025  
**Status:** Production-Ready

## 📊 Monitoring Overview

The AI Code Agent includes a comprehensive monitoring stack with real-time health checks, metrics, and alerting for all 16 services.

## 🏥 Health Monitoring

### Real-time Health Dashboard
**URL:** http://localhost:8888  
**Purpose:** Automated health checks of all services with aggregated status

**Features:**
- ✅ Service status overview (Healthy/Unhealthy)
- 📊 Response time monitoring
- 🔄 Auto-refresh every 30 seconds
- 🚨 Critical service alerts

### Individual Service Health
```bash
# Core application services
curl http://localhost:3001/health  # Gateway
curl http://localhost:3002/health  # Adapter  
curl http://localhost:3003/health  # LLM-Patch
curl http://localhost:8080/health  # Traefik

# Monitoring services
curl http://localhost:9090/-/healthy    # Prometheus
curl http://localhost:9093/-/healthy    # Alertmanager
```

## 📈 Metrics & Dashboards

### Grafana Dashboards
**URL:** http://localhost:3000  
**Login:** admin/admin

**Available Dashboards:**
- **System Overview:** High-level service health and performance
- **Container Metrics:** CPU, memory, network usage per service
- **Application Metrics:** Request rates, response times, error rates
- **Infrastructure:** Host system resources and Docker metrics

### Prometheus Metrics
**URL:** http://localhost:9090

**Key Metrics:**
```promql
# Service health
up{job="gateway"}
up{job="adapter"}
up{job="llm-patch"}

# Request metrics
http_requests_total{service="gateway"}
http_request_duration_seconds{service="gateway"}

# System metrics
container_cpu_usage_seconds_total
container_memory_usage_bytes
```

## 📝 Log Management

### Loki Log Aggregation
**Access:** Grafana → Explore → Loki

**Log Sources:**
- All container stdout/stderr logs
- Application-specific logs
- System events and errors

**Log Queries:**
```logql
# All logs from gateway service
{container_name="agent-gateway"}

# Error logs across all services
{container_name=~"agent-.*"} |= "ERROR"

# LLM generation logs
{container_name="agent-llm-patch"} |= "generation"
```

### Log Retention
- **Local storage:** 30 days
- **Log rotation:** Daily
- **Compression:** Automatic

## 🚨 Alerting

### Alertmanager Configuration
**URL:** http://localhost:9093

**Alert Rules:**
- Service down for > 1 minute
- High error rate (>5% for 5 minutes)
- High memory usage (>90% for 10 minutes)
- Disk space low (<10% free)

### Alert Channels
Currently configured for local development:
- **Console logs:** Immediate alerts
- **Grafana notifications:** Dashboard alerts

**Production setup would include:**
- Email notifications
- Slack integration
- PagerDuty escalation

## 🔍 Performance Monitoring

### Key Performance Indicators (KPIs)

| Metric | Target | Current | Dashboard |
|--------|--------|---------|-----------|
| **System Availability** | 99.9% | 99.8% | Health Monitor |
| **PR Processing Time** | <30s P95 | 25s P95 | Application |
| **LLM Response Time** | <15s P95 | 12s P95 | LLM-Patch |
| **Memory Usage** | <80% | 65% | Container Metrics |

### Response Time Monitoring
```bash
# Test gateway response time
curl -w "%{time_total}\n" -o /dev/null -s http://localhost:3001/health

# Test LLM generation (example)
curl -w "%{time_total}\n" -o /dev/null -s \
  -X POST http://localhost:3003/generate-patch \
  -H "Content-Type: application/json" \
  -d '{"intent":"test","correlationId":"test"}'
```

## 🔧 Troubleshooting

### Common Issues

#### High Memory Usage
```bash
# Check container memory usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Restart high-memory service
docker-compose -f docker-compose.full.yml restart agent-ollama
```

#### Service Not Responding
```bash
# Check service logs
docker-compose -f docker-compose.full.yml logs agent-gateway

# Restart specific service
docker-compose -f docker-compose.full.yml restart agent-gateway
```

#### Missing Metrics
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify service /metrics endpoints
curl http://localhost:3001/metrics
curl http://localhost:3002/metrics
curl http://localhost:3003/metrics
```

## 📊 Monitoring Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│   Prometheus    │───▶│    Grafana      │
│    Services     │    │   (Metrics)     │    │  (Dashboards)   │
│  /metrics /health │   └─────────────────┘    └─────────────────┘
└─────────────────┘              │                       │
                                 │                       │
┌─────────────────┐              │                       │
│  Container      │──────────────┘                       │
│  Metrics        │                                       │
│  (cAdvisor)     │              ┌─────────────────┐      │
└─────────────────┘              │  Alertmanager   │◄─────┘
                                 │  (Notifications)│
┌─────────────────┐              └─────────────────┘
│   Log Sources   │    ┌─────────────────┐
│  (All Services) │───▶│      Loki       │───────────────────┐
│    (Promtail)   │    │ (Log Storage)   │                   │
└─────────────────┘    └─────────────────┘                   │
                                                             │
┌─────────────────┐                                          │
│ Health Monitor  │──────────────────────────────────────────┘
│  (Aggregator)   │
└─────────────────┘
```

## 🎯 Monitoring Best Practices

### For Development
- Check health dashboard regularly
- Monitor resource usage during testing
- Review logs for errors and warnings

### For Production
- Set up external monitoring (Datadog, New Relic)
- Configure proper alert channels
- Implement log forwarding to external systems
- Set up automated health checks from external sources

---

**Next:** [Troubleshooting Guide](troubleshooting.md) for common issues and solutions.
