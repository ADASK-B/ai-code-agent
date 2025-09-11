# AI Code Agent – Enterprise Platform Transformation

_Last Updated: 2025-09-11_  
_Status:_ **Enterprise-Candidate** (Phase-1 in Umsetzung, Phase-2 geplant)

---

## 1) Vision Statement

**Von PR-Automation zur Enterprise-KI-Plattform.**  
Wir transformieren den bestehenden **AI Code Agent** von einem fokussierten PR-Automation-Tool zu einer **unternehmensweiten KI-Plattform** mit klaren **Governance-, Security- und Betriebsstandards** (Cloud/On-prem/Edge). Die Plattform dient als **Referenzarchitektur** für industrielle KI-Governance und beschleunigt TRUMPF-typische Anwendungsfälle (Assistenzsysteme, Code-Automation, Predictive/Visual Inspection).

**EN (one-liner):** From a PR bot to a governed, observable, multi-tenant **Enterprise AI Platform** that works across cloud and edge.

---

## 2) Enterprise Pain Points → Ziele

**Ausgangslage (Pain Points)**  
- 🏢 **Multi-Tenancy:** Keine saubere Mandantentrennung/Isolation.  
- 🔐 **Enterprise Auth:** OIDC/RBAC fehlt, kein SSO.  
- 🧾 **Compliance/Governance:** Fehlende Auditability, Modell- und Daten-Lineage.  
- ⚡ **Skalierung:** Docker Compose statt Kubernetes (Prod).  
- 🔄 **Integration:** Fokus auf Azure DevOps, Multi-SCM fehlt (GitHub/GitLab).  
- 🔭 **Observability:** Kein durchgängiges Tracing, begrenzte Business-Metriken.

**Zielbild (Outcomes)**  
- **Mandantenisolierung** auf Daten-, Netzwerk- und Ressourcenebene.  
- **SSO/Zero Trust** via OIDC/RBAC, Secrets via Vault.  
- **Governance by Design:** Audit-Trails, Model Cards, Data/Model Lineage.  
- **Cloud-native Skalierung:** K8s+Helm, GitOps, Ingress/Service-Mesh.  
- **Multi-Plattform-Adapter:** ADO/GitHub/GitLab, optionale OT-Protokolle (OPC UA/MQTT) als Erweiterung.  
- **Observability by Default:** OpenTelemetry, Traces/Metrics/Logs, SLO-Dashboards.

---

## 3) Enterprise Tech-Stack Matrix

### 🚀 Core Application Services (aktuell/nahe Zukunft)

| Component (Port) | Status | Purpose (Enterprise) | Integration & Dependencies |
|---|---|---|---|
| **Traefik (80/8080)** | **Keep & Extend** | Reverse Proxy / LB (Prod) | ← Ingress, ↔ Service Discovery, TLS, mTLS (Mesh) |
| **Gateway (3001)** | **Refactor** | Multi-Tenant API GW, Webhooks, Rate-Limiting | ← Traefik, → Orchestrator, ↔ Redis (Rate), → Prometheus |
| **Orchestrator (7071)** | **Refactor** | Workflows (FaaS → K8s Jobs/Workers) | ← Gateway, → Adapter/LLM-Patch, ↔ Queue |
| **Adapter (3002)** | **Refactor** | SCM-Integrationen (ADO/GitHub/GitLab) | ← Orchestrator, → SCM-APIs, ↔ Audit Log |
| **LLM-Patch (3003)** | **Keep & Extend** | Multi-Provider LLM Hub | ← Orchestrator, → Ollama/Claude/OpenAI, ↔ Model Registry |
| **Ingress (n/a)** | **Replace ngrok** | Prod-Ingress (Nginx/Traefik) | ← Webhooks extern, → Gateway, ↔ SSL/TLS |
| **Ollama (11434)** | **Keep & Scale** | Lokale Modelle (llama3.x) | ← LLM-Patch, ↔ GPU/HPA, → Model Registry |
| **Azurite (10000-2)** | **Migrate → PostgreSQL** | Dev-Emulator → Prod-DB | ← Orchestrator-State, → Multi-Tenant Schema |

### 📊 Observability Stack (Prod-ready Foundation)

| Component | Status | Purpose | Integration & Dependencies |
|---|---|---|---|
| **Health Monitor (8888)** | **Keep & Extend** | Aggregation, SLA-Checks | → Alle Services, ↔ Alerting, → Prometheus |
| **Prometheus (9090) → Thanos** | **Extend** | Metrics + LT-Storage | ← /metrics, → Grafana/Alertmanager, → Thanos ObjStore |
| **Grafana (3000) → Enterprise** | **Upgrade** | Mandanten-Dashboards, BI | ← Prometheus/Loki/Tempo, ↔ OIDC, → Alert Channels |
| **Loki (3100)** | **Keep & Scale** | Zentrales Logging, Compliance | ← Promtail, → Grafana, ↔ S3/MinIO |
| **Promtail (agent)** | **Keep** | Log Shipping/Parsing | ← Container Logs, → Loki |
| **Alertmanager (9093)** | **Extend** | Alert-Routing | ← Prometheus, → Slack/Email/PagerDuty |
| **Tempo/Jaeger** | **Create** | Distributed Tracing | ← OTel Collector, → Grafana Tempo/Jaeger UI |
| **cAdvisor (8081)** | **Keep** | Container-Ressourcen | → Prometheus |
| **Node Exporter (9100)** | **Keep** | Host-Metriken | → Prometheus |
| **OpenTelemetry Collector** | **Create** | Standardisierte Telemetrie-Pipeline | ← Services/SDKs, → Prom/Tempo/Loki |

### 🔐 Enterprise Security & Auth

| Component | Status | Purpose | Integration & Dependencies |
|---|---|---|---|
| **OIDC/OAuth2 (Azure AD/Keycloak)** | **Create** | SSO, Token-Flows | ↔ Alle Services, → JWT Validation |
| **RBAC/ABAC** | **Create** | Rollen/Attribute-Berechtigungen | ← OIDC, ↔ Multi-Tenancy/Namespaces |
| **HashiCorp Vault + External Secrets Operator** | **Create** | Secrets/KMS, Encryption | ↔ K8s Secrets, ↔ Compliance |
| **WAF (Cloud/Ingress)** | **Create** | OWASP Top 10, DDoS | ← External, → Traefik/Ingress, ↔ Threat-Intel |
| **Supply-Chain Security** | **Create** | SBOM, Signing, Policies | Syft/SBOM, Cosign, Trivy/Grype, OPA/Kyverno |

### 💾 Enterprise Data Layer

| Component | Status | Purpose | Integration & Dependencies |
|---|---|---|---|
| **PostgreSQL HA (Patroni)** | **Create** | Multi-Tenant DB | ↔ Services, → Audit Logs, ↔ Backup/DR |
| **Redis (cache/queue/rate)** | **Create** | Sessions, Queues, Idempotency | ↔ Gateway/Orchestrator |
| **MinIO/S3** | **Create** | Artifacts/Models/Logs | → Model Storage, ↔ Backups, → Archive |
| **Backups/DR (Velero, WAL-G)** | **Create** | RPO/RTO Ziele | ↔ K8s/ObjStore/DB |

### 🤖 AI/ML Platform

| Component | Status | Purpose | Integration & Dependencies |
|---|---|---|---|
| **Model Registry (MLflow)** | **Create** | Lifecycle, Promotion, Policy Gates | ↔ MLOps Pipeline, → LLM-Patch, ↔ Governance |
| **Vector DB (pgvector/Weaviate)** | **Create** | RAG/KM | ↔ LLM-Services, → Knowledge Base |
| **Feature Store (Feast)** | **Create** | Reusable Features | ↔ ETL/ELT, ↔ Models |
| **GPU Auto-Scaling** | **Create** | Kosten/Leistung | ↔ HPA/Karpenter, → Ollama/Inference Pods |

### ⚙️ Cloud-Native Platform

| Component | Status | Purpose | Integration & Dependencies |
|---|---|---|---|
| **Kubernetes + Helm/Kustomize** | **Create** | Orchestrierung | → Alle Services, ↔ Auto-Scaling |
| **GitOps (Argo CD)** | **Create** | CD/Drift-Schutz | ← Git, → Cluster, ↔ Config Mgmt |
| **Service Mesh (Istio/Linkerd)** | **Create** | mTLS, Traffic Mgmt | ↔ Services, → Telemetry |
| **Ingress Controller** | **Create** | Prod Ingress (TLS) | ← External, → Mesh/Services |

### 🔄 Enterprise Integration (Async)

| Component | Status | Purpose | Integration & Dependencies |
|---|---|---|---|
| **Apache Kafka** | **Create** | Event Streaming/Sourcing | → Audit Trail, → Analytics |
| **Redis/RabbitMQ** | **Create** | Job-Queues/Workers | ↔ Orchestrator, → Workers |
| **OpenTelemetry + Collector** | **Create** | Std. Telemetry Pipeline | ↔ All Services, → Prom/Tempo/Loki |

---

## 4) Governance, Compliance & Risk

- **EU AI Act & GDPR-Ready:** DPIA-Vorlagen, **Model Cards**, Data/Model **Lineage**, **Risk Register** (H/M/L), **Human-in-the-Loop** für kritische Aktionen.  
- **Policies as Code:** **OPA/Kyverno** (Namespace-Isolation, Image-Sign-Enforce, NetworkPolicies, PodSecurity).  
- **Auditability:** Unveränderliche Logs (Loki + Object Lock), Audit-Events (Kafka Topic), **Change-Approval** Gates.  
- **Supply-Chain:** **SBOM (Syft)**, **Scanning (Trivy/Grype)**, **Signing (Cosign)**, **SLSA-Level** Targets.  
- **DR & Resilienz:** RPO ≤ 15 min (DB/WAL-G), RTO ≤ 1 h (Velero restores, blue/green).

---

## 5) Architektur-Prinzipien

- **Separation of Concerns:** UI, Orchestrierung, Adaption, LLM-Hub, Data Layer klar entkoppelt.  
- **Tenant-Isolation:** K8s-Namespaces/ResourceQuotas/NetworkPolicies; **DB-Schema pro Tenant**; KMS-Keys pro Tenant.  
- **Resilienz:** Retries/Backoff, **Circuit Breaker**, Idempotency Keys, Dead Letter Queues.  
- **12-Factor & GitOps:** Konfiguration als Code, deklarative Deployments, Drift-Detection.  
- **Observability First:** OTel-SDK in jedem Service, Korrelation (trace_id/span_id) in Logs.

---

## 6) Transformation Roadmap

### Phase 1 – **Foundation (Monat 1–2)**  
**Quick Wins & Security Baseline**
- OpenTelemetry (SDK + Collector) → **E2E Tracing** (Tempo/Jaeger).  
- **Redis** (Session/Rate Limit/Idempotency).  
- **PostgreSQL HA** (Schema-Design Multi-Tenant, Migration Azurite → PG).  
- **OIDC (Azure AD)** + **Basic RBAC**.  
- **Vault + External-Secrets-Operator**.

**Entry/Exit-Kriterien:**  
- E: Architektur-Review, Umgebungen (dev/stage/prod).  
- X: Trace-Kette für 3 kritische Flows; SSO für Devs; Migration ohne Downtime P95>99%.

### Phase 2 – **Scale & Resilience (Monat 3–4)**  
**Production Readiness**
- **K8s-Migration** (Helm Charts, Readiness/Liveness, HPA).  
- **Message Queue** (Redis/RabbitMQ) → Async-Jobs.  
- **Mandanten-Isolation** (NS/Quotas/NP + DB-Schema).  
- **Model Registry (MLflow)** + Promotion-Gates.  
- **Backup/DR** (Velero + WAL-G), **Thanos** für Long-Term-Metrics.

**SLO-Ziele:** Verfügbarkeit 99,9 %, P95 < 5 s, 50+ Tenants.

### Phase 3 – **Enterprise Features (Monat 5–6)**  
- **GraphQL Gateway** (Schema-Stitching) über REST hinweg.  
- **Vector DB** (pgvector/Weaviate) → RAG.  
- **GitOps-Pipelines** (Argo CD App-of-Apps).  
- **Business-Metriken** in Grafana (Velocity/Lead Time/ROI).  
- **Compliance Dashboard** (DPIA, Model Cards, Audit-KPIs).

### Phase 4 – **AI Excellence (Monat 7+)**  
- **Federated Learning** (PoC).  
- **AutoML** für Modell-Tuning.  
- **Knowledge Graph** (Domänenwissen).  
- **Multi-Modal** (Code+Docs), **Edge-Deployments** (k3s, offline-Puffer).

---

## 7) Enterprise Success Criteria (SLI/SLO)

| Metric | Current | Target (Enterprise) | Timeline |
|---|---:|---:|---:|
| **Availability** | 99,0 % | **99,9 %** | 6 Monate |
| **Latency** | P95 15 s | **P95 < 5 s** | 3 Monate |
| **Concurrent Users** | 10 | **500+** | 6 Monate |
| **Multi-Tenancy** | ❌ | **✅ Vollständig** | 4 Monate |
| **Compliance** | Basic | **SOC2-ready / ISO27001-controls** | 8 Monate |

**Enterprise SLOs (Beispiel, PromQL/YAML):**
```yaml
availability:
  target: 99.9%
  measurement: "avg_over_time(up[30d])"

latency_p95:
  target: "< 5s"
  measurement: "histogram_quantile(0.95, sum(rate(request_duration_seconds_bucket[5m])) by (le))"

error_rate:
  target: "< 0.1%"
  measurement: "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))"

tenant_isolation:
  target: "100% data separation"
  measurement: "increase(audit_tenant_data_leaks_total[30d]) == 0"
