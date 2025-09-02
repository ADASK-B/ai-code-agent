# 🚀 Code Agent MVP - Quick Reference (Updated)

## 📊 **State-of-the-Art Monitoring Stack**

### **🎯 Monitoring URLs**
```bash
Grafana Dashboard:    http://localhost:3000    # Login: admin/admin123
Prometheus:           http://localhost:9090    # Metrics Database
AlertManager:         http://localhost:9093    # Alert Management
```

### **📈 Service Endpoints**
```bash
Gateway Health:       http://localhost:3001/health
Gateway Metrics:      http://localhost:3001/metrics
Host Metrics:         http://localhost:9100/metrics
Container Metrics:    http://localhost:8081/metrics
```

### **🚀 Quick Start Commands**
```bash
# System starten
cd ops/compose && docker-compose -f docker-compose.simple.yml up -d
cd ../monitoring && docker-compose -f docker-compose.monitoring.yml up -d

# Status prüfen
curl http://localhost:3001/health
curl http://localhost:3001/metrics

# Dashboards öffnen
open http://localhost:3000    # Grafana
open http://localhost:9090    # Prometheus
```

---

## 🏗️ **Service Architecture**

### **Core Services**
- **Gateway:** Webhook receiver (Port 3001) + Prometheus metrics
- **Traefik:** Reverse proxy (Port 8080)
- **ngrok:** Public tunnel for ADO webhooks

### **🎯 Monitoring Services**
- **Prometheus:** Time-series metrics database (Port 9090)
- **Grafana:** Professional dashboards (Port 3000)
- **AlertManager:** Alert routing & notifications (Port 9093)
- **Loki:** Log aggregation (Port 3100)
- **Node Exporter:** Host metrics (Port 9100)
- **cAdvisor:** Container metrics (Port 8081)

---

## 📊 **Key Metrics**

### **Business Metrics**
```prometheus
ado_webhooks_total                    # ADO webhook count
http_requests_total                   # HTTP request count
http_request_duration_seconds         # Request latency
orchestrator_calls_total              # Orchestrator API calls
```

### **System Metrics**
```prometheus
up                                    # Service availability
node_cpu_seconds_total               # CPU usage
node_memory_MemAvailable_bytes       # Memory usage
container_cpu_usage_seconds_total    # Container CPU
container_memory_usage_bytes         # Container memory
```

---

## 🚨 **Alert Thresholds**

### **Critical Alerts**
- Service Down: `up == 0` for > 1min
- High Error Rate: `error_rate > 10%` for > 2min
- Container Killed: Container not seen for > 1min

### **Warning Alerts**
- High Response Time: `P95 > 2s` for > 5min
- High CPU: `CPU > 80%` for > 5min
- High Memory: `Memory > 85%` for > 10min
- No Webhooks: No ADO webhooks for > 30min

---

## 🔧 **Troubleshooting**

### **Common Issues**
```bash
# Service not responding
docker ps -a | grep agent-
docker logs <container-name>

# Metrics not appearing
curl http://localhost:3001/metrics
curl http://localhost:9090/targets

# Dashboard not loading
docker logs agent-grafana
```

### **Port Conflicts**
```bash
# Check port usage
netstat -an | grep :3000
netstat -an | grep :9090

# Alternative ports if needed
Grafana:     3000 → 3001
Prometheus:  9090 → 9091
```

---

## 📋 **Development Workflow**

### **1. Start System**
```bash
cd ops/compose
docker-compose -f docker-compose.simple.yml up -d
cd ../monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### **2. Verify Health**
```bash
curl http://localhost:3001/health
curl http://localhost:9090/-/healthy
curl http://localhost:3000/api/health
```

### **3. Monitor Development**
- **Real-time Metrics:** Grafana dashboard auto-refresh
- **Request Tracing:** Watch HTTP metrics in Prometheus
- **Log Monitoring:** Loki dashboard in Grafana

### **4. Testing Webhooks**
```bash
# Get ngrok URL
curl http://127.0.0.1:4040/api/tunnels

# Test webhook endpoint
curl -X POST https://<tunnel>.ngrok.io/webhook/ado \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=test" \
  -d '{"eventType":"git.pullrequest.commented"}'
```

---

## 🎯 **Production Ready Features**

### **✅ Enterprise Monitoring**
- Prometheus time-series database (15d retention)
- Grafana professional dashboards
- AlertManager incident management
- Comprehensive metrics collection

### **✅ Observability**
- Request latency percentiles (P50, P95, P99)
- Error rate monitoring
- Resource utilization tracking
- Business KPI monitoring

### **✅ Operational Excellence**
- Real-time alerting
- Historical data analysis
- Performance trending
- Capacity planning data

---

**🎉 Status: State-of-the-Art Enterprise Monitoring Active!**
