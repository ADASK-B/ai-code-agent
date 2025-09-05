# AI Code Agent – Copilot Instructions

⚠ HEILIGER GRAL / SINGLE SOURCE OF TRUTH (immer zuerst öffnen)
1. `Agents.md`  ← Navigation Hub / „Wiki“ für alles: Start → Health → Monitoring → Stop → Troubleshooting. MUSS IMMER aktuell sein und bei jeder Prozess-/Service-Änderung zuerst gepflegt werden.
2. `README.md`  – Architektur (Diagramme) & High-Level Zweck (nur Übersicht, keine Ablaufdetails pflegen!)
3. `services/shared/src/contracts.ts` – Zentrale Contracts, Limits & Konstanten (ändert sich hier etwas → Branching / Variant / Patch Logik prüfen)
4. `services/gateway/src/index.ts` – Webhook Entry, `/ready` Orchestrator Check, Korrelation-ID Muster
5. `services/llm-patch/src/index.ts` – Patch/Clarification Pipeline & Provider-Fallback Reihenfolge
6. `docker-compose.full.yml` – Vollständiger Stack (Ports, Service-Namen, Health Abhängigkeiten)
7. `AgentsMd/Initialisierung/Agents.md` – Aktuelle detaillierte Start-/Health-Prozedur (verlinkt aus `Agents.md`)

Regel: Neue Abläufe / Änderungen (Start, Stop, Health, Webhook, Modelle) → zuerst `Agents.md` aktualisieren, dann (falls nötig) Referenzen hier korrigieren. Diese Datei ist nur der kompakte Index für AI Agents.

## 1. Core Purpose
Automates Azure DevOps PR comment intents: user writes `@User /edit /N <intent>` -> system creates N draft PR variants with code changes + explanations.

## 2. Service Topology (docker-compose.full.yml)
Core (7): Traefik (80/8080), Gateway (3001), Adapter (3002), LLM-Patch (3003), Orchestrator (7071 – Azure Functions), ngrok (4040), Ollama (11434).
Observability (8): Health Monitor (8888), Grafana (3000), Prometheus (9090), Alertmanager (9093), Loki (3100), Promtail (internal), cAdvisor (8081), Node Exporter (9100).
Infra: Azurite (10000-10002) storage emulator.

## 3. Primary Flow
Azure DevOps PR Comment -> ADO Webhook -> ngrok -> Traefik -> Gateway `/webhook/ado` -> Orchestrator (workflow) -> Adapter (branches/PRs/comments) + LLM-Patch (patch generation) -> Ollama / external LLMs -> Adapter posts status & draft PRs.

## 4. Contracts & Limits (see `services/shared/src/contracts.ts`)
- EditVariantsInput orchestrates job; idempotency via `idempotencyKey` + correlationId.
- PatchResult unified diff + notes + confidence.
- Hard limits: MAX_PATCH_SIZE_BYTES=200000, MAX_FILES_IN_PATCH=50, MAX_VARIANTS=10, VARIANT_TIMEOUT_MINUTES=8.
- Supported file extensions list controls patch scope.

## 5. Gateway Patterns (`services/gateway/src/index.ts`)
- Fastify with helmet, cors, rate-limit, Prometheus metrics (`/metrics`).
- Health: `/health` self; `/ready` actively checks orchestrator.
- Correlation IDs: header `x-corr-id` or generated `gw-<timestamp>-<rand>`.
- Webhook endpoint: strict ADO event payload (see AdoWebhookEvent in contracts) -> pass downstream.

## 6. LLM-Patch Service (`services/llm-patch/src/index.ts`)
- Provider priority: Ollama (local) -> Claude -> OpenAI -> mock.
- Vague intent detection triggers clarification response (fields: `needsClarification`, `clarificationQuestion`, `suggestedOptions`).
- Generates unified diff using `diff.createPatch`; fallback mock modifies first listed file.
- Variant style rotates: conservative, modern, creative, performance, experimental.

## 7. Observability
- Each service exposes `/health`; Gateway adds `/ready`; Prometheus scrapes metrics endpoints.
- Logs: Promtail -> Loki; metrics: cAdvisor + Node Exporter -> Prometheus; dashboards in Grafana (admin/admin default).
- Health Monitor (8888) aggregates service statuses.

## 8. Environment & Startup
- Copy `.env.example` to `.env`; supply ADO PAT, ngrok token, optional LLM keys.
- One-shot start: `docker compose -f docker-compose.full.yml up -d --build`.
- Codespaces auto-start via devcontainer `postStartCommand`; ngrok disabled by default there.

## 9. Key Env Vars (examples – ensure presence before orchestration)
- `WEBHOOK_SECRET`, `AZDO_ORG`, `AZDO_PROJECT`, `AZDO_REPO`, `AZDO_PAT`.
- `ENABLE_NGROK=true|false`, `OLLAMA_URL=http://local-llm:11434`.
- Optional: `CLAUDE_API_KEY`, `OPENAI_API_KEY` (or they fallback to mock output).

## 10. Conventions
- Branch naming: `agents/edit-<prId>-<variant>`.
- Diff format: unified diff only; no file creations unless explicitly supported (currently only modify existing).
- Correlation IDs propagate to logs; include when adding new service calls.
- Retry configs per domain (LLM, ADO) defined centrally.

## 11. Adding a New Service
1. Expose `/health` (+ `/metrics` if needed).
2. Register in compose, label for Promtail if logs required.
3. Add scrape config in Prometheus if metrics endpoint added.
4. Update Health Monitor if aggregated.

## 12. Common Pitfalls
- Early alert noise right after startup (Prometheus scrape timing) – ignore first ~60s.
- Ollama large model (llama3.1:8b) pull is heavy; ensure memory or switch to smaller model via env.
- Missing `.env` causes orchestrator readiness failures in Gateway `/ready`.
- Vague PR intents (“fix”, “update”) intentionally return clarification instead of patch.

## 13. Quick Test (LLM-Patch)
POST `/generate-patch` with `{ intent, variantNumber, prMeta:{...}, correlationId }` -> returns PatchResult or clarification structure.

## 14. Safe Change Checklist for AI Agents
- Touch only files within supported extensions list unless instructed.
- Keep diffs minimal & focused; preserve headers & existing comments.
- Always include correlationId when adding new request flows.
- Respect MAX_* limits; truncate or split logic if exceeded.

## 15. Where to Look Next (kurzer Index)
- Navigation / Operations (Pflicht zuerst): `Agents.md`
- Detaillierter Start/Health Ablauf: `AgentsMd/Initialisierung/Agents.md`
- Architektur Übersicht: `README.md`
- Contracts & Limits: `services/shared/src/contracts.ts`
- Gateway Entry / Webhook: `services/gateway/src/index.ts`
- Patch & LLM Provider Logic: `services/llm-patch/src/index.ts`
- Voller Stack / Ports: `docker-compose.full.yml`

(End of instructions – keep concise; update when architecture or limits change.)
