workspace "AI Code Agent" "Enterprise-grade AI-powered code generation system integrated with Azure DevOps" {

    model {
        # ==============================================================================
        # PERSONAS & EXTERNAL SYSTEMS
        # ==============================================================================
        
        developer = person "Developer" "Software developer using Azure DevOps for code reviews and pull requests" "Developer"
        
        azureDevOps = softwareSystem "Azure DevOps" "Microsoft's DevOps platform providing source control, work tracking, and CI/CD pipelines" "External System"
        
        openAI = softwareSystem "OpenAI API" "GPT-4 and other language models for code generation" "External System,LLM"
        claude = softwareSystem "Anthropic Claude" "Claude AI language models for advanced code reasoning" "External System,LLM"
        
        # ==============================================================================
        # AI CODE AGENT SYSTEM (MAIN FOCUS)
        # ==============================================================================
        
        aiCodeAgent = softwareSystem "AI Code Agent" "Automated code generation system that responds to Azure DevOps pull request comments with AI-generated code patches" {
            
            # PRESENTATION LAYER
            gateway = container "API Gateway" "Handles incoming webhooks, authentication, and request routing" "Fastify/Node.js" "WebServer"
            
            # CORE BUSINESS LOGIC
            orchestrator = container "Workflow Orchestrator" "Coordinates the end-to-end workflow from webhook to PR creation" "Azure Functions" "Function"
            
            adapter = container "Azure DevOps Adapter" "Manages interactions with Azure DevOps APIs (branches, PRs, comments)" "Fastify/Node.js" "Service"
            
            llmPatch = container "LLM Patch Service" "Handles AI-powered code generation with multi-provider support" "Fastify/Node.js" "Service"
            
            # INFRASTRUCTURE LAYER  
            localLLM = container "Local LLM (Ollama)" "Self-hosted language models for privacy-conscious code generation" "Ollama" "AI,Local"
            
            # NETWORKING & SECURITY
            proxy = container "Load Balancer" "Reverse proxy with SSL termination and service discovery" "Traefik" "Infrastructure"
            tunnel = container "Webhook Tunnel" "Secure tunnel for Azure DevOps webhook delivery" "ngrok" "Infrastructure"
            
            # STORAGE & PERSISTENCE
            storage = container "Object Storage" "Azure-compatible storage emulator for temporary data and logs" "Azurite" "Database"
            
            # OBSERVABILITY STACK
            monitoring = container "Monitoring Stack" "Comprehensive observability with metrics, logs, and alerting" "Prometheus/Grafana/Loki" "Monitoring"
            
            healthMonitor = container "Health Monitor" "Automated health checks and service status aggregation" "Node.js" "Monitoring"
        }
        
        # ==============================================================================
        # RELATIONSHIPS - USER INTERACTIONS
        # ==============================================================================
        
        developer -> azureDevOps "Creates PRs, writes comments using @user /edit /N <intent> syntax"
        developer -> aiCodeAgent "Indirectly triggers via Azure DevOps webhooks" 
        
        # ==============================================================================
        # RELATIONSHIPS - EXTERNAL INTEGRATIONS
        # ==============================================================================
        
        azureDevOps -> gateway "Sends webhook events for PR comments" "HTTPS/JSON"
        
        adapter -> azureDevOps "Creates branches, draft PRs, and status comments" "REST API"
        
        llmPatch -> openAI "Requests code generation via GPT-4 API" "HTTPS/JSON"
        llmPatch -> claude "Requests code generation via Claude API" "HTTPS/JSON"
        llmPatch -> localLLM "Requests code generation locally" "HTTP/JSON"
        
        # ==============================================================================
        # RELATIONSHIPS - INTERNAL CONTAINER COMMUNICATION
        # ==============================================================================
        
        # Webhook Flow
        gateway -> orchestrator "Triggers workflow with validated webhook payload" "HTTP/JSON"
        
        # Orchestration Flow
        orchestrator -> llmPatch "Requests AI code generation with intent analysis" "HTTP/JSON"
        orchestrator -> adapter "Requests branch/PR operations" "HTTP/JSON"
        
        # Service Dependencies
        gateway -> monitoring "Sends metrics and trace data" "HTTP"
        adapter -> monitoring "Sends metrics and trace data" "HTTP"
        llmPatch -> monitoring "Sends metrics and trace data" "HTTP"
        orchestrator -> monitoring "Sends metrics and trace data" "HTTP"
        
        # Infrastructure Dependencies
        proxy -> gateway "Routes external traffic" "HTTP"
        proxy -> adapter "Routes internal API calls" "HTTP"
        proxy -> llmPatch "Routes internal API calls" "HTTP"
        
        tunnel -> proxy "Exposes webhook endpoint to internet" "HTTPS"
        
        # Storage Dependencies
        orchestrator -> storage "Stores temporary workflow state" "HTTP/REST"
        adapter -> storage "Caches Azure DevOps data" "HTTP/REST"
        
        # Health & Monitoring
        healthMonitor -> gateway "Performs health checks" "HTTP"
        healthMonitor -> adapter "Performs health checks" "HTTP"
        healthMonitor -> llmPatch "Performs health checks" "HTTP"
        healthMonitor -> orchestrator "Performs health checks" "HTTP"
        healthMonitor -> localLLM "Performs health checks" "HTTP"
        
        # ==============================================================================
        # DEPLOYMENT ENVIRONMENTS
        # ==============================================================================
        
        live = deploymentEnvironment "Production" {
            deploymentNode "Azure Container Instances" {
                containerHost = infrastructureNode "Container Host" "Azure Container Instances with managed scaling" "Azure"
                aiCodeAgentProd = softwareSystemInstance aiCodeAgent
            }
            
            deploymentNode "Azure Key Vault" {
                keyVault = infrastructureNode "Secret Management" "Secure storage for API keys and webhook secrets" "Azure"
            }
            
            deploymentNode "Azure Monitor" {
                azureMonitor = infrastructureNode "Enterprise Monitoring" "Application Insights and Log Analytics" "Azure"
            }
        }
        
        development = deploymentEnvironment "Development" {
            deploymentNode "Developer Workstation" {
                laptop = infrastructureNode "Local Docker" "Docker Compose environment for local development" "Docker"
                aiCodeAgentDev = softwareSystemInstance aiCodeAgent
            }
        }
    }

    views {
        # ==============================================================================
        # SYSTEM CONTEXT VIEW - HIGH LEVEL OVERVIEW
        # ==============================================================================
        
        systemContext aiCodeAgent "SystemContext" "High-level overview of the AI Code Agent system and its environment" {
            include *
            autoLayout
        }
        
        # ==============================================================================
        # CONTAINER VIEW - INTERNAL SYSTEM ARCHITECTURE  
        # ==============================================================================
        
        container aiCodeAgent "Containers" "Internal architecture of the AI Code Agent system showing all containers and their relationships" {
            include *
            autoLayout
        }
        
        # ==============================================================================
        # COMPONENT VIEW - DETAILED SERVICE BREAKDOWN
        # ==============================================================================
        
        # LLM Patch Service Components (Most Complex)
        component llmPatch "LLMPatchComponents" "Detailed breakdown of the LLM Patch Service showing internal components" {
            include *
            autoLayout
        }
        
        # ==============================================================================
        # DEPLOYMENT VIEWS - RUNTIME ENVIRONMENTS
        # ==============================================================================
        
        deployment aiCodeAgent "Production" "ProductionDeployment" "Production deployment architecture on Azure" {
            include *
            autoLayout
        }
        
        deployment aiCodeAgent "Development" "DevelopmentDeployment" "Local development environment using Docker Compose" {
            include *
            autoLayout
        }
        
        # ==============================================================================
        # DYNAMIC VIEWS - KEY WORKFLOWS
        # ==============================================================================
        
        dynamic aiCodeAgent "WebhookToCodeGeneration" "Webhook to Code Generation Workflow" {
            developer -> azureDevOps "1. Writes PR comment: @user /edit /1 Add error handling"
            azureDevOps -> gateway "2. Sends webhook event"
            gateway -> orchestrator "3. Validates and triggers workflow"
            orchestrator -> llmPatch "4. Requests code generation"
            llmPatch -> localLLM "5. Generates code patch via AI"
            localLLM -> llmPatch "6. Returns unified diff"
            llmPatch -> orchestrator "7. Returns patch result"
            orchestrator -> adapter "8. Requests branch creation"
            adapter -> azureDevOps "9. Creates branch and draft PR"
            azureDevOps -> developer "10. Notifies about new draft PR"
            autoLayout
        }
        
        dynamic aiCodeAgent "ErrorHandlingAndFallback" "Error Handling and Provider Fallback" {
            orchestrator -> llmPatch "1. Requests code generation"
            llmPatch -> localLLM "2. Attempts local LLM first"
            localLLM -> llmPatch "3. Returns error (model not available)"
            llmPatch -> claude "4. Falls back to Claude API"
            claude -> llmPatch "5. Returns successful generation"
            llmPatch -> orchestrator "6. Returns final result"
            autoLayout
        }
        
        # ==============================================================================
        # FILTERED VIEWS - SPECIFIC CONCERNS
        # ==============================================================================
        
        container aiCodeAgent "MonitoringArchitecture" "Observability and monitoring architecture showing how telemetry flows through the system" {
            include monitoring healthMonitor gateway adapter llmPatch orchestrator
            autoLayout
        }
        
        container aiCodeAgent "SecurityArchitecture" "Security-focused view showing authentication, authorization, and secret management" {
            include gateway proxy tunnel
            autoLayout
        }
        
        # ==============================================================================
        # STYLING & THEMES
        # ==============================================================================
        
        styles {
            element "Person" {
                background #2E86AB
                color #ffffff
                shape Person
            }
            
            element "Software System" {
                background #A23B72
                color #ffffff
            }
            
            element "External System" {
                background #C73E1D
                color #ffffff
            }
            
            element "Container" {
                background #F18F01
                color #ffffff
            }
            
            element "WebServer" {
            background #2E86AB
            color #ffffff
            shape WebBrowser
        }
        
        element "Database" {
            background #A23B72
            color #ffffff
            shape Cylinder
        }
        
        element "Service" {
            background #F18F01
            color #ffffff
            shape Component
        }
        
        element "Function" {
            background #C73E1D
            color #ffffff
            shape Component
        }
        
        element "Infrastructure" {
            background #666666
            color #ffffff
            shape Component
        }
        
        element "Monitoring" {
            background #28a745
            color #ffffff
            shape Component
        }
        
        element "AI" {
            background #6f42c1
            color #ffffff
            shape Component
        }
        
        element "LLM" {
            background #e83e8c
            color #ffffff
        }
        
        relationship "Relationship" {
            color #2E86AB
            thickness 2
        }
    }
}
