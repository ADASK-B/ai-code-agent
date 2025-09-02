# 📊 State-of-the-Art Monitoring Guide

## 🎯 **Aktueller Status: Enterprise-Grade Observability**

Wir haben erfolgreich von einem selbstgebauten Health Monitor auf eine **professionelle Prometheus + Grafana Stack** umgestellt.

### ✅ **Was wir jetzt haben:**

| **Component** | **URL** | **Purpose** | **Industry Standard** |
|---------------|---------|-------------|----------------------|
| **🏠 Grafana** | `http://localhost:3000` | Professional Dashboards & Alerting | ✅ Netflix, Google, Spotify |
| **📊 Prometheus** | `http://localhost:9090` | Time-Series Metrics Database | ✅ CNCF Standard |
| **🚨 AlertManager** | `http://localhost:9093` | Alert Routing & Notifications | ✅ Production Alerting |
| **📋 Loki** | `http://localhost:3100` | Centralized Log Aggregation | ✅ Modern Logging |
| **🖥️ Node Exporter** | `http://localhost:9100` | Host System Metrics | ✅ Infrastructure Monitoring |
| **🐳 cAdvisor** | `http://localhost:8081` | Docker Container Metrics | ✅ Container Observability |

---

## 🚀 **Quick Start**

### 1. Monitoring Stack starten
```bash
cd ops/monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Dashboards öffnen
```bash
# Grafana Professional Dashboard
open http://localhost:3000
# Login: admin / admin123

# Prometheus Metrics Explorer  
open http://localhost:9090

# AlertManager (Incident Management)
open http://localhost:9093
```

### 3. Service Metrics prüfen
```bash
# Gateway Service Metrics
curl http://localhost:3001/metrics

# Host System Metrics
curl http://localhost:9100/metrics

# Container Metrics
curl http://localhost:8081/metrics
```

---

## 📈 **Verfügbare Metrics**

### **🚪 Gateway Service Metrics**
```prometheus
# HTTP Request Metrics
http_requests_total{method, route, status}              # Total requests
http_request_duration_seconds{method, route, status}    # Request latency

# ADO Webhook Metrics  
ado_webhooks_total{event_type, status, repository}      # Webhook count
ado_webhook_processing_duration_seconds{event_type}     # Processing time

# Orchestrator Communication
orchestrator_calls_total{endpoint, status}              # API calls
orchestrator_call_duration_seconds{endpoint, status}    # Call latency

# Security Metrics
hmac_validation_total{status}                           # HMAC validation
rate_limit_hits_total{client_ip}                        # Rate limiting

# Business Metrics
gateway_active_connections                              # Active connections
gateway_queued_webhooks                                 # Queue depth
```

### **🖥️ Host System Metrics**
```prometheus
# CPU Usage
node_cpu_seconds_total{mode}                            # CPU time per mode
100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)  # CPU Usage %

# Memory Usage
node_memory_MemTotal_bytes                              # Total memory
node_memory_MemAvailable_bytes                          # Available memory
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100  # Memory Usage %

# Disk Usage
node_filesystem_size_bytes{mountpoint="/"}             # Disk size
node_filesystem_avail_bytes{mountpoint="/"}            # Available disk
```

### **🐳 Container Metrics**
```prometheus
# Container Resource Usage
container_cpu_usage_seconds_total{name}                # Container CPU
container_memory_usage_bytes{name}                     # Container memory
container_network_receive_bytes_total{name}            # Network RX
container_network_transmit_bytes_total{name}           # Network TX

# Container Health
container_last_seen{name}                              # Last seen timestamp
up{job}                                                 # Service availability
```

---

## 🎨 **Grafana Dashboards**

### **Production Overview Dashboard**
```
📊 Service Health Status     ⏱️ Response Time P95
📈 Request Rate (RPS)        🚨 Error Rate %  
🔗 ADO Webhook Processing    💻 CPU Usage
🧠 Memory Usage              🐳 Container Resources
```

### **Dashboard Features:**
- ✅ **Real-time Updates** (10s refresh)
- ✅ **Time Range Selection** (1h, 6h, 1d, 7d)
- ✅ **Alert Annotations** 
- ✅ **Drill-down Capabilities**
- ✅ **Mobile Responsive**

---

## 🚨 **Alerting Rules**

### **Critical Alerts**
```yaml
ServiceDown:           # Service offline > 1min
HighErrorRate:         # Error rate > 10% for 2min  
ContainerKilled:       # Container crashed
```

### **Warning Alerts**
```yaml
HighResponseTime:      # P95 latency > 2s for 5min
HighCPUUsage:         # CPU > 80% for 5min
HighMemoryUsage:      # Memory > 85% for 10min
NoADOWebhooks:        # No webhooks for 30min
```

### **Alert Destinations**
- **Development:** Console logs + Grafana UI
- **Production:** Slack channels, Email, PagerDuty

---

## 🔍 **Monitoring Best Practices**

### **1. Golden Signals** ✅
- **Latency:** Response time percentiles (P50, P95, P99)
- **Traffic:** Request rate and throughput
- **Errors:** Error rate and error types
- **Saturation:** Resource utilization (CPU, Memory, Disk)

### **2. Service Level Indicators (SLIs)** ✅
- **Gateway Availability:** `avg(up{job="gateway"}) * 100 > 99.9%`
- **Response Time:** `histogram_quantile(0.95, http_request_duration_seconds) < 1s`
- **Error Rate:** `rate(http_requests_total{status=~"5.."}[5m]) < 1%`

### **3. Alert Fatigue Prevention** ✅
- **Meaningful Thresholds:** Based on business impact
- **Alert Grouping:** Related alerts grouped together
- **Escalation Policies:** Critical vs Warning severity
- **Runbook Links:** Each alert links to response guide

---

## 📊 **Grafana Setup Guide**

### **1. Initial Login**
```bash
URL: http://localhost:3000
Username: admin
Password: admin123
```

### **2. Import Dashboards**
1. **Go to:** `+ → Import`
2. **Select:** `/ops/monitoring/grafana/dashboards/production-overview.json`
3. **Configure:** Data source = "Prometheus"

### **3. Alert Configuration**
1. **Go to:** `Alerting → Alert Rules`
2. **Import:** `/ops/monitoring/alert.rules.yml`
3. **Configure:** Notification channels (Slack, Email)

---

## 🔄 **Migration von Legacy Health Monitor**

### **❌ Alter Custom Health Monitor:**
```javascript
// Selbstgebautes HTML Dashboard
// Nur Status: OK/FAIL
// Keine historischen Daten
// Kein Alerting
```

### **✅ Neuer Prometheus Stack:**
```yaml
# Enterprise-Grade Observability
# Time-Series Metrics mit 15d Retention
# Professional Dashboards via Grafana
# Real-time Alerting via AlertManager
# Industry Standard Tools
```

### **Migration Benefits:**
- **📈 Historical Data:** 15 Tage Retention statt Live-Only
- **🎨 Professional UI:** Grafana statt selbstgebautes HTML
- **🚨 Real Alerting:** AlertManager statt passives Monitoring
- **📊 Rich Metrics:** CPU, Memory, Network statt nur Health
- **🔧 Zero Maintenance:** Standard Tools statt Custom Code
- **👥 Team Familiarity:** Industry Standard statt Eigenentwicklung

---

## 🎯 **Production Readiness**

### **✅ Was wir erreicht haben:**
- **Enterprise Monitoring Stack** wie Netflix, Google, Spotify
- **Professional Dashboards** mit Grafana
- **Real-time Alerting** mit AlertManager  
- **Comprehensive Metrics** für alle Services
- **Scalable Architecture** von Development bis Production

### **🚀 Nächste Steps:**
1. **Orchestrator Metrics** hinzufügen (Azure Functions)
2. **Adapter Metrics** implementieren (ADO API calls)
3. **LLM-Patch Metrics** hinzufügen (AI response times)
4. **Business KPIs** definieren (Webhook success rate)
5. **Production Alerts** konfigurieren (Slack integration)

**Das ist jetzt State-of-the-Art! 🎉**
