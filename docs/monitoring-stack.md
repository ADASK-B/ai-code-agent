# Monitoring Stack Architecture

**Author:** Arthur Schwan  
**Last Updated:** September 11, 2025  
**Status:** Production-Ready (8 Services Running)

## 📊 Monitoring & Observability Stack

The AI Code Agent includes a **comprehensive monitoring infrastructure** with 8 specialized services providing complete observability, metrics, logging, and alerting.

## 📈 Service Overview

| Port | Service | Container | Purpose | Technology |
|------|---------|-----------|---------|------------|
| **8888** | **Health Monitor** | agent-health-monitor | Automated Health Checks | Node.js/Express |
| **3000** | **Grafana** | agent-grafana | Dashboards & Visualization | React/Go |
| **9090** | **Prometheus** | agent-prometheus | Metrics Database | Go/PromQL |
| **3100** | **Loki** | agent-loki | Log Aggregation | Go/LogQL |
| **9093** | **Alertmanager** | agent-alertmanager | Alert Notifications | Go/YAML |
| **8081** | **cAdvisor** | agent-cadvisor | Container Metrics | Go/Docker |
| **9100** | **Node Exporter** | agent-node-exporter | Host System Metrics | Go/Prometheus |
| **Internal** | **Promtail** | agent-promtail | Log Collection Agent | Go/Loki |

## 🔄 Monitoring Data Flow

### Metrics Pipeline
```
Application Services (Metrics Endpoints)
    ↓ (HTTP /metrics)
Prometheus (9090) ← cAdvisor (8081) + Node Exporter (9100)
    ↓ (PromQL Queries)
Grafana Dashboards (3000)
    ↓ (Alert Rules)
Alertmanager (9093)
    ↓ (Notifications)
Alert Channels (Email/Slack/PagerDuty)
```

### Logging Pipeline
```
All Container Logs (stdout/stderr)
    ↓ (Docker Log Driver)
Promtail Agent (Internal)
    ↓ (HTTP Push)
Loki Log Storage (3100)
    ↓ (LogQL Queries)
Grafana Log Explorer (3000)
```

### Health Check Pipeline
```
Health Monitor (8888)
    ↓ (HTTP Health Checks)
All Services (/health endpoints)
    ↓ (Aggregated Status)
Real-time Health Dashboard
    ↓ (Alert on Failures)
Immediate Notifications
```

## 🏗️ Detailed Service Descriptions

### 🏥 **Health Monitor (Port 8888)**
**Purpose:** Automated Health Check Aggregator  
**Technology:** Node.js with Express  
**Role:**
- Continuously monitors all 15 other services
- Provides real-time health dashboard
- Aggregates service status and response times
- Sends immediate alerts on service failures

**Key Features:**
- Auto-discovery of services
- Configurable health check intervals (30s default)
- Response time tracking
- Service dependency mapping
- Real-time web dashboard with auto-refresh

**Dashboard Access:** http://localhost:8888

### 📊 **Grafana (Port 3000)**
**Purpose:** Monitoring Dashboards & Visualization  
**Technology:** React frontend with Go backend  
**Role:**
- Central monitoring dashboard interface
- Visualizes metrics from Prometheus and logs from Loki
- Provides alerting and notification management
- Supports custom dashboard creation

**Key Features:**
- Pre-built dashboards for system overview
- Container performance metrics visualization
- Application-specific dashboards
- Log correlation with metrics
- Alert rule management and notification channels

**Access:** http://localhost:3000 (admin/admin)

**Available Dashboards:**
- **Production Overview:** System-wide health and performance
- **Container Metrics:** CPU, memory, network per service
- **Application Metrics:** Request rates, response times, errors
- **Infrastructure Metrics:** Host system resources

### 📈 **Prometheus (Port 9090)**
**Purpose:** Metrics Database & Alert Engine  
**Technology:** Go with PromQL query language  
**Role:**
- Collects and stores time-series metrics data
- Scrapes metrics from all services every 15 seconds
- Evaluates alert rules and triggers notifications
- Provides powerful querying capabilities with PromQL

**Key Features:**
- Multi-dimensional metrics with labels
- Flexible service discovery
- Built-in alert rule evaluation
- HTTP API for metric queries
- Data retention and compression

**Access:** http://localhost:9090

**Key Metrics Collected:**
```promql
# Service availability
up{job="gateway", instance="agent-gateway:3001"}

# HTTP request metrics
http_requests_total{service="gateway", method="POST", status="200"}
http_request_duration_seconds{service="gateway", quantile="0.95"}

# Container resource usage
container_cpu_usage_seconds_total{name="agent-gateway"}
container_memory_usage_bytes{name="agent-gateway"}

# Custom application metrics
ai_code_generation_duration_seconds{variant="1", status="success"}
ado_webhook_events_total{event_type="pullrequest.created"}
```

### 📝 **Loki (Port 3100)**
**Purpose:** Log Aggregation & Search Engine  
**Technology:** Go with LogQL query language  
**Role:**
- Centralized log storage for all container logs
- Provides fast log search and filtering
- Correlates logs with metrics in Grafana
- Efficient log indexing and compression

**Key Features:**
- Label-based log indexing (similar to Prometheus)
- LogQL for powerful log queries
- Integration with Grafana for log visualization
- Automatic log parsing and structuring
- Retention policies and compression

**Access:** Grafana → Explore → Loki

**Example LogQL Queries:**
```logql
# All logs from gateway service
{container_name="agent-gateway"}

# Error logs across all services
{container_name=~"agent-.*"} |= "ERROR"

# LLM generation logs with timing
{container_name="agent-llm-patch"} |= "generation" | logfmt | duration > 30s

# Azure DevOps webhook events
{container_name="agent-gateway"} |= "webhook" |= "pullrequest"
```

### 🚨 **Alertmanager (Port 9093)**
**Purpose:** Alert Notifications & Routing  
**Technology:** Go with YAML configuration  
**Role:**
- Receives alerts from Prometheus
- Routes alerts to appropriate notification channels
- Handles alert grouping, inhibition, and silencing
- Manages escalation policies

**Key Features:**
- Multi-channel notifications (email, Slack, PagerDuty)
- Alert grouping and deduplication
- Silence management for maintenance windows
- Escalation and routing rules
- Web UI for alert management

**Access:** http://localhost:9093

**Alert Rules:**
- Service down for > 1 minute
- High error rate (>5% for 5 minutes)
- High memory usage (>90% for 10 minutes)
- LLM generation timeouts (>60 seconds)
- Disk space low (<10% free)

### 📦 **cAdvisor (Port 8081)**
**Purpose:** Container Metrics Collection  
**Technology:** Go with Docker API integration  
**Role:**
- Monitors Docker container resource usage
- Collects CPU, memory, network, and disk metrics
- Provides per-container performance insights
- Exports metrics to Prometheus

**Key Features:**
- Real-time container monitoring
- Resource usage history
- Network and disk I/O tracking
- Container lifecycle events
- Automatic container discovery

**Access:** http://localhost:8081

**Metrics Provided:**
- CPU usage per container and core
- Memory usage and limits
- Network I/O statistics
- Disk I/O and filesystem usage
- Container start/stop events

### 🖥️ **Node Exporter (Port 9100)**
**Purpose:** Host System Metrics Collection  
**Technology:** Go with system API integration  
**Role:**
- Monitors host system resources
- Collects hardware and OS-level metrics
- Provides infrastructure monitoring data
- Exports metrics to Prometheus

**Key Features:**
- CPU, memory, and disk usage
- Network interface statistics
- System load and process counts
- Filesystem and mount point monitoring
- Hardware sensor data (temperature, etc.)

**Access:** http://localhost:9100/metrics

**Metrics Provided:**
- `node_cpu_seconds_total` - CPU time breakdown
- `node_memory_MemTotal_bytes` - Total system memory
- `node_disk_io_time_seconds_total` - Disk I/O time
- `node_network_receive_bytes_total` - Network traffic
- `node_load1` - System load average

### 📋 **Promtail (Internal)**
**Purpose:** Log Collection Agent  
**Technology:** Go with Docker log driver  
**Role:**
- Collects logs from all Docker containers
- Parses and labels log entries
- Ships logs to Loki for storage
- Handles log formatting and filtering

**Key Features:**
- Automatic container log discovery
- Log parsing and labeling
- Rate limiting and backpressure handling
- Retry logic for reliable delivery
- Multiple output targets support

**Configuration:**
- Monitors all container stdout/stderr
- Labels logs with container metadata
- Parses structured logs (JSON, logfmt)
- Filters sensitive information
- Batches logs for efficient delivery

## 🚀 Deployment & Configuration

### Quick Start
```bash
# Start monitoring stack with core services
docker-compose -f docker-compose.full.yml up -d

# Access monitoring interfaces
open http://localhost:8888   # Health Monitor
open http://localhost:3000   # Grafana (admin/admin)
open http://localhost:9090   # Prometheus
open http://localhost:9093   # Alertmanager
```

### Health Verification
```bash
# Check monitoring services
curl http://localhost:8888/api/health    # Health Monitor
curl http://localhost:9090/-/healthy     # Prometheus
curl http://localhost:9093/-/healthy     # Alertmanager
curl http://localhost:3000/api/health    # Grafana

# Verify metrics collection
curl http://localhost:9090/api/v1/targets
curl http://localhost:9090/api/v1/query?query=up

# Check log collection
curl http://localhost:3100/ready         # Loki
```

## 📊 Key Performance Indicators (KPIs)

| Metric | Target | Current | Alert Threshold |
|--------|--------|---------|-----------------|
| **System Availability** | 99.9% | 99.8% | <99.5% |
| **PR Processing Time** | <30s P95 | 25s P95 | >60s P95 |
| **LLM Response Time** | <15s P95 | 12s P95 | >30s P95 |
| **Memory Usage** | <80% | 65% | >90% |
| **Disk Usage** | <70% | 45% | >85% |
| **Error Rate** | <1% | 0.3% | >5% |

## 🔧 Alert Configuration

### Critical Alerts
```yaml
# Service down
- alert: ServiceDown
  expr: up == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Service {{ $labels.job }} is down"

# High error rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High error rate on {{ $labels.service }}"

# Memory usage
- alert: HighMemoryUsage
  expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "High memory usage on {{ $labels.name }}"
```

## 💡 Best Practices

### For Development
- Monitor health dashboard during testing
- Review logs in Grafana during debugging
- Set up alerts for critical service failures
- Use metrics to identify performance bottlenecks

### For Production
- Configure external alert channels (email, Slack)
- Set up log forwarding to external systems
- Implement proper alert escalation policies
- Monitor resource usage trends for capacity planning

---

**Next:** [Core Services](core-services.md) for application services documentation.
