# 🚀 Monitoring Upgrade: State-of-the-Art Stack

## ❌ **Aktueller Zustand (Selbstgebaut)**
```javascript
// Unser custom Health Monitor
- Eigenes HTML Dashboard
- Hardcoded Service-Liste  
- Keine Metriken, nur Status
- Keine historischen Daten
- Kein Alerting
```

## ✅ **State-of-the-Art: Prometheus + Grafana Stack**

### **Phase 1: Standard Observability Stack**

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  # Metrics Collection
  prometheus:
    image: prom/prometheus:v2.45.0
    container_name: agent-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--web.enable-lifecycle'
      - '--storage.tsdb.retention.time=15d'
    networks:
      - code-agent

  # Visualization & Alerting
  grafana:
    image: grafana/grafana:10.0.0
    container_name: agent-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    networks:
      - code-agent

  # Log Aggregation
  loki:
    image: grafana/loki:2.8.0
    container_name: agent-loki
    ports:
      - "3100:3100"
    volumes:
      - ./monitoring/loki.yml:/etc/loki/local-config.yaml
    command: -config.file=/etc/loki/local-config.yaml
    networks:
      - code-agent

  # Log Collection
  promtail:
    image: grafana/promtail:2.8.0
    container_name: agent-promtail
    volumes:
      - /var/log:/var/log:ro
      - /var/run/docker.sock:/var/run/docker.sock
      - ./monitoring/promtail.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
    networks:
      - code-agent

  # Node Metrics (Host metrics)
  node-exporter:
    image: prom/node-exporter:v1.6.0
    container_name: agent-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - code-agent

  # Docker Metrics
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.47.0
    container_name: agent-cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg
    networks:
      - code-agent

volumes:
  prometheus-data:
  grafana-data:

networks:
  code-agent:
    external: true
```

### **Service Instrumentation (State-of-the-Art)**

```typescript
// services/gateway/src/metrics.ts
import prometheus from 'prom-client';

// Create metrics registry
export const register = new prometheus.Registry();

// Default Node.js metrics
prometheus.collectDefaultMetrics({ register });

// Custom business metrics
export const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

export const httpRequestCount = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

export const adoWebhookCount = new prometheus.Counter({
  name: 'ado_webhooks_total',
  help: 'Total ADO webhooks received',
  labelNames: ['event_type', 'status']
});

export const orchestratorCallDuration = new prometheus.Histogram({
  name: 'orchestrator_call_duration_seconds',
  help: 'Duration of calls to orchestrator service',
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestCount);
register.registerMetric(adoWebhookCount);
register.registerMetric(orchestratorCallDuration);
```

```typescript
// services/gateway/src/middleware/metrics.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { httpRequestDuration, httpRequestCount } from '../metrics';

export async function metricsMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const start = Date.now();
  
  reply.addHook('onSend', async () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: request.method,
      route: request.routerPath || 'unknown',
      status: reply.statusCode.toString()
    };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestCount.inc(labels);
  });
}
```

### **Prometheus Configuration**

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert.rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # Gateway Service
  - job_name: 'gateway'
    static_configs:
      - targets: ['agent-gateway:3001']
    metrics_path: '/metrics'
    scrape_interval: 10s

  # Orchestrator Service  
  - job_name: 'orchestrator'
    static_configs:
      - targets: ['agent-orchestrator:7071']
    metrics_path: '/metrics'

  # Node/Host Metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  # Docker Container Metrics
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  # Traefik Metrics
  - job_name: 'traefik'
    static_configs:
      - targets: ['agent-traefik:8080']
    metrics_path: '/metrics'
```

### **Grafana Dashboard (JSON)**

```json
{
  "dashboard": {
    "title": "Code Agent MVP - Production Dashboard",
    "panels": [
      {
        "title": "Service Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=~\"gateway|orchestrator|adapter|llm-patch\"}"
          }
        ]
      },
      {
        "title": "HTTP Request Rate",
        "type": "graph", 
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time P95",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "ADO Webhook Processing",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ado_webhooks_total[5m])"
          }
        ]
      },
      {
        "title": "Container Resource Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total{name=~\"agent-.*\"}[5m]) * 100"
          }
        ]
      }
    ]
  }
}
```

## 🚀 **Schnelle Implementierung**

### **Step 1: Metrics zu Gateway hinzufügen**
```bash
cd services/gateway
npm install prom-client
```

### **Step 2: Monitoring Stack starten**
```bash
# Neue monitoring/docker-compose.yml erstellen
docker-compose -f docker-compose.yml -f monitoring/docker-compose.yml up -d
```

### **Step 3: Dashboards importieren**
- Grafana öffnen: http://localhost:3000
- Login: admin/admin123
- Import Dashboard: JSON aus obigem Code

## 📊 **Vorher/Nachher Vergleich**

| **Feature** | **Aktuell (Custom)** | **State-of-the-Art (Prometheus)** |
|-------------|----------------------|----------------------------------|
| **Metrics Storage** | ❌ Keine | ✅ Time Series DB (15d retention) |
| **Dashboards** | ❌ Selbstgebaut HTML | ✅ Grafana (Industry Standard) |
| **Alerting** | ❌ Keine | ✅ AlertManager + Slack/Email |
| **Service Discovery** | ❌ Hardcoded | ✅ Automatisch via Labels |
| **Historical Data** | ❌ Keine | ✅ 15 Tage Retention |
| **Business Metrics** | ❌ Nur Health | ✅ ADO Webhooks, Response Times |
| **Host Metrics** | ❌ Keine | ✅ CPU, Memory, Disk, Network |
| **Container Metrics** | ❌ Nur Docker Status | ✅ cAdvisor (CPU, Memory per Container) |
| **Maintenance** | ❌ Custom Code | ✅ Standard Tools (Updates, Support) |

## 💡 **Empfehlung**

1. **JETZT:** Metrics zu Gateway Service hinzufügen
2. **Diese Woche:** Prometheus + Grafana Setup  
3. **Nächste Woche:** Orchestrator/Adapter/LLM Metrics
4. **Production:** AlertManager für Incident Response

**Unser Health Monitor ist lehrreich, aber für Production sollten wir auf bewährte Tools setzen!** 🎯
