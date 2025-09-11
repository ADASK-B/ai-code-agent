workspace "AI Code Agent" "C4-Modell für das ai-code-agent Repo" {

  !identifiers hierarchical

  model {
    // C1: Personen & Nachbarsysteme
    developer = person "Developer" "Löst Änderungen via Kommentar/Command im Repo aus."
    ado = softwareSystem "Azure DevOps" "Quell-Repo & Pull Requests."
    github = softwareSystem "GitHub" "Alternative: Quell-Repo & Pull Requests."
    
    // External LLM providers
    ollama = softwareSystem "Ollama" "Local LLM inference server"
    claude = softwareSystem "Claude API" "Anthropic's Claude LLM service"
    openai = softwareSystem "OpenAI API" "OpenAI's GPT models"

    aiAgent = softwareSystem "AI Code Agent" "Automatisiert Kommentar → Analyse → Patch → PR." {
        // C2: Container (laufende Deploymenteinheiten/Services)
        webhook = container "Webhook Service" "Node/TypeScript" "Empfängt Events (Kommentare/PR-Hooks) & validiert." {
            webhookHandler = component "Webhook Handler" "Processes incoming ADO webhooks"
            requestValidator = component "Request Validator" "Validates and sanitizes requests"
            correlationManager = component "Correlation Manager" "Manages request correlation IDs"
            rateLimiter = component "Rate Limiter" "Implements rate limiting"
            metricsCollector = component "Metrics Collector" "Collects and exports metrics"
        }
        orchestrator = container "Orchestrator" "Functions/Container" "Steuert Workflow, Idempotenz, Retry/Backoff." {
            workflowEngine = component "Workflow Engine" "Orchestrates the edit workflow"
            idempotencyManager = component "Idempotency Manager" "Ensures idempotent operations"
            retryManager = component "Retry Manager" "Handles retries with backoff"
            statusTracker = component "Status Tracker" "Tracks operation status"
        }
        llmGateway = container "LLM Gateway" "Service" "Provider-agnostische Schnittstelle zu Sprachmodellen (LLM)." {
            intentProcessor = component "Intent Processor" "Processes natural language intents"
            providerManager = component "Provider Manager" "Manages multiple LLM providers"
            patchGenerator = component "Patch Generator" "Generates unified diff patches"
            confidenceAnalyzer = component "Confidence Analyzer" "Analyzes generation confidence"
        }
        adapter = container "Adapter" "Service" "Azure DevOps integration" {
            adoClient = component "ADO Client" "Azure DevOps REST API client"
            branchManager = component "Branch Manager" "Creates and manages feature branches"
            prManager = component "PR Manager" "Creates and updates pull requests"
            commentManager = component "Comment Manager" "Posts status updates as comments"
        }
        evalService = container "Eval Service" "Service" "Golden Tests, Metriken, Guardrails/Evals."
        vectorStore = container "Vector Store" "DB" "Optional für RAG (Retrieval-Augmented Generation)."
        telemetry = container "Telemetry/OTel Exporter" "Service" "Logs/Metriken/Traces (OTel = OpenTelemetry)."
        secrets = container "Key Vault" "Service" "Serverseitige Secrets/Keys; Zugriff via Managed Identity."
    }

    // Beziehungen (wer spricht mit wem)
    developer -> aiAgent "Kommentar/Command (z. B. /edit)" "HTTPS"
    ado -> aiAgent "Webhook: PR/Kommentar" "HTTPS"
    github -> aiAgent "Webhook: PR/Kommentar" "HTTPS"

    aiAgent.webhook -> aiAgent.orchestrator "validierte Events" "internal"
    aiAgent.orchestrator -> aiAgent.llmGateway "Prompts/Tools" "internal"
    aiAgent.orchestrator -> aiAgent.evalService "Eval (offline/online)" "internal"
    aiAgent.orchestrator -> aiAgent.vectorStore "Kontextsuche (RAG)" "internal"
    aiAgent.orchestrator -> ado "PR erstellen/aktualisieren" "REST API"
    aiAgent.orchestrator -> github "PR erstellen/aktualisieren" "REST API"
    aiAgent.orchestrator -> aiAgent.secrets "Secrets/Token abrufen" "managed"
    aiAgent.orchestrator -> aiAgent.telemetry "Traces/Metriken/Logs" "OTel"
    aiAgent.llmGateway -> aiAgent.secrets "Provider-Keys (serverseitig)" "managed"
    aiAgent.evalService -> aiAgent.telemetry "Eval-Metriken" "OTel"

    // LLM provider connections
    aiAgent.llmGateway -> ollama "Generates code patches" "HTTP"
    aiAgent.llmGateway -> claude "Generates code patches" "HTTPS"
    aiAgent.llmGateway -> openai "Generates code patches" "HTTPS"

    // Adapter connections
    aiAgent.orchestrator -> aiAgent.adapter "Requests ADO operations" "HTTP"
    aiAgent.adapter -> ado "Creates branches, PRs, comments" "REST API"
    aiAgent.adapter -> github "Creates branches, PRs, comments" "REST API"
  }

  views {
    // C1: System Context
    systemContext aiAgent "SystemContext" {
      include *
      autoLayout lr
      description "Übersicht über das gesamte AI Code Agent System und externe Abhängigkeiten"
    }

    // C2: Container
    container aiAgent "Containers" {
      include *
      autoLayout lr
      description "Detaillierte Darstellung der Microservices (Gateway, Orchestrator, LLM-Patch, Adapter)"
    }

    // C3: Component views
    component aiAgent.webhook "WebhookComponents" {
      include *
      autoLayout lr
      description "Interne Struktur des Webhook Service"
    }

    component aiAgent.orchestrator "OrchestratorComponents" {
      include *
      autoLayout lr
      description "Interne Struktur des Orchestrator Service"
    }

    component aiAgent.llmGateway "LLMGatewayComponents" {
      include *
      autoLayout lr
      description "Interne Struktur des LLM Gateway Service"
    }

    component aiAgent.adapter "AdapterComponents" {
      include *
      autoLayout lr
      description "Interne Struktur des Adapter Service"
    }

    themes default
  }
}
