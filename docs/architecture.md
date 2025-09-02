# Architektur - Code Agent MVP

## System-Übersicht

```mermaid
flowchart TB
    subgraph "User Flow"
        User[👤 Developer] --> PR[📋 Pull Request]
        PR --> Comment[💬 /edit /N intent]
    end

    subgraph "Azure DevOps"
        Comment --> Webhook[🔔 Service Hook]
        Webhook --> |HMAC Signed| Gateway
    end

    subgraph "Code Agent Platform"
        Gateway[🚪 Gateway<br/>Fastify] --> |Validate & Route| Orchestrator
        
        subgraph "Durable Functions"
            Orchestrator[⚙️ Orchestrator<br/>Azure Functions v4] --> |Fan-out| Activities
            Activities[📋 Activities] --> |Fan-in| Results[📊 Results]
        end

        subgraph "Backend Services"
            Adapter[🔌 Adapter<br/>ADO Integration]
            LLMPatch[🧠 LLM-Patch<br/>Code Generation]
            Storage[(💾 Azure Storage<br/>Durable State)]
            Audit[(📈 Supabase<br/>Jobs & Variants)]
        end

        subgraph "🚀 Enterprise Monitoring"
            Prometheus[📊 Prometheus<br/>Metrics DB]
            Grafana[📈 Grafana<br/>Dashboards]
            AlertManager[🚨 AlertManager<br/>Incident Mgmt]
            Loki[📋 Loki<br/>Log Aggregation]
        end

        Gateway --> |/metrics| Prometheus
        Orchestrator --> |/metrics| Prometheus
        Adapter --> |/metrics| Prometheus
        LLMPatch --> |/metrics| Prometheus

        Orchestrator --> Adapter
        Orchestrator --> LLMPatch
        Orchestrator --> Storage
        Orchestrator --> Audit
    end

    subgraph "External Services"
        Claude[🤖 Claude API]
        ADO[📁 Azure DevOps<br/>REST API]
        LLMPatch --> Claude
        Adapter --> ADO
    end

    subgraph "Output"
        ADO --> DraftPR1[📄 Draft PR v1]
        ADO --> DraftPR2[📄 Draft PR v2]
        ADO --> DraftPRN[📄 Draft PR vN]
        ADO --> Comments[💬 Status Comments]
    end

    style Gateway fill:#e1f5fe
    style Orchestrator fill:#f3e5f5
    style Adapter fill:#e8f5e8
    style LLMPatch fill:#fff3e0
    style Claude fill:#fce4ec
    style ADO fill:#e3f2fd
```

## Deployment-Varianten

### 1. Local Development (ngrok)

```mermaid
flowchart LR
    subgraph "Developer Machine"
        subgraph "Docker Compose"
            Traefik[🌐 Traefik<br/>:80] --> Gateway
            Gateway --> Orchestrator
            Gateway --> Adapter
            Gateway --> LLMPatch
            Orchestrator --> Azurite[(💾 Azurite<br/>Storage Emulator)]
        end
        
        ngrok[🔗 ngrok Tunnel] --> Traefik
    end
    
    ADO[📁 Azure DevOps] --> |Webhook| ngrok
    LLMPatch --> Claude[🤖 Claude API]
    Adapter --> ADO
```

### 2. Azure Cloud (Horizontal Scaling)

```mermaid
flowchart TB
    subgraph "Azure"
        subgraph "Container Apps"
            Gateway[🚪 Gateway] --> LB1[⚖️ Load Balancer]
            LB1 --> Adapter1[🔌 Adapter 1]
            LB1 --> Adapter2[🔌 Adapter 2]
            LB1 --> AdapterN[🔌 Adapter N]
            
            LB2[⚖️ Load Balancer] --> LLM1[🧠 LLM-Patch 1]
            LB2 --> LLM2[🧠 LLM-Patch 2]
            LB2 --> LLMN[🧠 LLM-Patch N]
        end
        
        subgraph "Functions (Consumption Premium)"
            Orchestrator[⚙️ Orchestrator<br/>Auto-scale]
        end
        
        subgraph "Azure Services"
            Storage[(💾 Azure Storage)]
            KeyVault[🔐 Key Vault]
            AppInsights[📊 App Insights]
            ACR[📦 Container Registry]
        end
        
        Gateway --> Orchestrator
        Orchestrator --> Storage
        Gateway --> KeyVault
        Orchestrator --> AppInsights
    end
    
    ADO[📁 Azure DevOps] --> Gateway
    LLM1 --> Claude[🤖 Claude API]
    Adapter1 --> ADO
```

### 3. Customer Server (Single VM)

```mermaid
flowchart LR
    subgraph "Customer VM"
        Traefik[🌐 Traefik<br/>TLS/443] --> Services
        
        subgraph "Docker Services"
            Services --> Gateway[🚪 Gateway]
            Services --> Orchestrator[⚙️ Orchestrator<br/>Functions Runtime]
            Services --> Adapter[🔌 Adapter]
            Services --> LLMLocal[🧠 LLM-Patch<br/>Local Model]
            Services --> Azurite[(💾 Azurite)]
        end
        
        systemd[⚙️ systemd<br/>Auto-restart] --> Services
    end
    
    DNS[🌐 customer.domain] --> Traefik
    ADO[📁 Customer ADO] --> Traefik
    LLMLocal --> vLLM[🤖 Customer LLM<br/>vLLM/TGI]
```

## Datenfluss

### 1. Orchestration Flow

```mermaid
sequenceDiagram
    participant User
    participant ADO
    participant Gateway
    participant Orch as Orchestrator
    participant Adapter
    participant LLM as LLM-Patch
    participant Storage

    User->>ADO: Comment "/edit /2 make buttons red"
    ADO->>Gateway: Webhook (HMAC signed)
    Gateway->>Gateway: Validate, extract idempotency key
    Gateway->>Orch: Start orchestration
    
    Orch->>Storage: Save instance state
    Orch->>Adapter: Set PR status "in_progress"
    Orch->>Adapter: Post start comment
    
    par Variant 1
        Orch->>Adapter: Create branch v1
        Orch->>LLM: Generate patch v1
        LLM-->>Orch: Unified diff
        Orch->>Adapter: Commit patch v1
        Orch->>Adapter: Open draft PR v1
        Orch->>Adapter: Post DONE comment v1
    and Variant 2
        Orch->>Adapter: Create branch v2
        Orch->>LLM: Generate patch v2
        LLM-->>Orch: Unified diff
        Orch->>Adapter: Commit patch v2
        Orch->>Adapter: Open draft PR v2
        Orch->>Adapter: Post DONE comment v2
    end
    
    Orch->>Adapter: Post final overview
    Orch->>Adapter: Set PR status "success"
    Orch->>Storage: Complete instance
```

### 2. Error Handling & Retries

```mermaid
flowchart TD
    Start[Activity Start] --> Execute[Execute]
    Execute --> Success{Success?}
    Success -->|Yes| Complete[Complete]
    Success -->|No| Retryable{Retryable?}
    
    Retryable -->|Yes| Backoff[Exponential Backoff]
    Backoff --> MaxRetries{Max Retries?}
    MaxRetries -->|No| Execute
    MaxRetries -->|Yes| PartialFail[Mark Variant Failed]
    
    Retryable -->|No| PartialFail
    PartialFail --> Continue[Continue Other Variants]
    Continue --> Complete
    
    Complete --> End[End]
```

## Sicherheitsarchitektur

```mermaid
flowchart TB
    subgraph "Security Layers"
        subgraph "L1: Network"
            HTTPS[🔒 HTTPS/TLS]
            HMAC[🔑 HMAC Verification]
            Firewall[🛡️ Firewall Rules]
        end
        
        subgraph "L2: Authentication"
            PAT[🎫 ADO Personal Access Token]
            APIKey[🔐 LLM API Keys]
            ServiceAuth[⚙️ Service-to-Service Auth]
        end
        
        subgraph "L3: Authorization"
            Permissions[📋 Least Privilege]
            Quotas[⏱️ Rate Limiting]
            Validation[✅ Input Validation]
        end
        
        subgraph "L4: Data Protection"
            KeyVault[🗝️ Azure Key Vault]
            Encryption[🔐 Encryption at Rest]
            LogScrubbing[🧹 Secret Scrubbing]
        end
    end
    
    Gateway --> HTTPS
    Gateway --> HMAC
    Adapter --> PAT
    LLMPatch --> APIKey
    Services --> KeyVault
```

## Monitoring & Observability

```mermaid
flowchart LR
    subgraph "Application"
        Gateway --> Traces[📊 Traces]
        Orchestrator --> Metrics[📈 Metrics]
        Adapter --> Logs[📝 Logs]
    end
    
    subgraph "Azure Monitor"
        Traces --> AppInsights[📊 Application Insights]
        Metrics --> AppInsights
        Logs --> AppInsights
        
        AppInsights --> Alerts[🚨 Alerts]
        AppInsights --> Dashboard[📋 Dashboard]
    end
    
    subgraph "SLOs"
        SLO1[P95 < 90s]
        SLO2[Error Rate < 2%]
        SLO3[429 Rate < 5%]
    end
    
    Dashboard --> SLO1
    Dashboard --> SLO2
    Dashboard --> SLO3
```

## Branch & PR Naming Schema

```mermaid
flowchart TD
    Comment["/edit /3 make buttons red"] --> Parse[Parse Intent]
    Parse --> Slug[Generate Slug: "make-buttons-red"]
    Slug --> Branch1["users/alice/make-buttons-red/v1"]
    Slug --> Branch2["users/alice/make-buttons-red/v2"]
    Slug --> Branch3["users/alice/make-buttons-red/v3"]
    
    Branch1 --> PR1["🔧 AI Edit v1: make-buttons-red"]
    Branch2 --> PR2["🔧 AI Edit v2: make-buttons-red"]
    Branch3 --> PR3["🔧 AI Edit v3: make-buttons-red"]
```

## Legende

| Symbol | Bedeutung |
|--------|-----------|
| 🚪 | Gateway/Ingress |
| ⚙️ | Orchestrator/Engine |
| 🔌 | Adapter/Integration |
| 🧠 | LLM/AI Service |
| 💾 | Storage/Database |
| 🔒 | Security/Authentication |
| 📊 | Monitoring/Metrics |
| 🌐 | Network/Proxy |
| 📦 | Container/Package |
| 🤖 | External AI Service |
