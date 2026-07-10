# 🚀 AI-Era Infrastructure Engineer — End-to-End Roadmap (2026)

**Target roles:** AI-driven DevOps Engineer · Cloud Engineer · Site Reliability Engineer (SRE) · Platform Engineer

**Philosophy:** Foundations first, **then layer AI on top**. AI does not replace core infra skills — agents run *on top of* Linux, Kubernetes, Terraform, and CI/CD. You must understand the systems well enough to validate what the AI suggests. AI is woven into every stage below as an **🤖 AI layer**, not bolted on at the end.

**How to use this file:** Work top-to-bottom. Don't skip a stage until its checkpoint project works. Tick boxes as we go. Each stage lists: core skills, the tools, the AI leverage, and a hands-on checkpoint.

---

## 🧭 The 4 roles — how they diverge (same base, different emphasis)

| Role | Owns primarily | Extra emphasis |
|---|---|---|
| **Cloud Engineer** | Provisioning cloud infra (compute, storage, network, IAM) | Multi-cloud, cost, GPU/AI infra |
| **DevOps Engineer** | CI/CD pipelines, automation, release flow | Toolchain glue, IaC, AI-assisted ops |
| **SRE** | Reliability: SLIs/SLOs, error budgets, incident response | AIOps, AI SRE, on-call, chaos |
| **Platform Engineer** | Internal Developer Platform (IDP) as a *product* | Backstage, golden paths, self-service, developer UX |

They share **~80% of the base** (Stages 0–6). You pick your emphasis at Stages 7–11.

---

## 🟢 STAGE 0 — Computing & Linux Foundations
- [ ] Linux fundamentals: filesystem, permissions, processes, systemd, package mgmt
- [ ] The shell: bash, pipes, redirection, env vars
- [ ] Networking basics: TCP/IP, DNS, HTTP/HTTPS, ports, load balancing, firewalls
- [ ] Git & GitHub: branching, PRs, merge vs rebase
- [ ] A scripting language: **Python** and/or **Node.js** (you have Node — good)
- 🤖 **AI layer:** Start using an AI coding assistant (Copilot / Claude Code / Cursor) *from day one* — but verify everything it writes. Learn to prompt for shell commands and explain-this-error.
- **✅ Checkpoint:** Automate a real task with a script (e.g. a backup/cleanup script) written *with* an AI assistant, and explain every line yourself.

## 🟢 STAGE 1 — Cloud Fundamentals
- [ ] Pick ONE cloud to go deep (AWS recommended for job market; Azure/GCP fine)
- [ ] Core primitives: compute (VM/EC2), storage (S3/blob), networking (VPC), IAM
- [ ] Managed databases, DNS, CDN, secrets manager
- [ ] Billing & cost basics (this becomes FinOps later)
- 🤖 **AI layer:** Cloud AI services are now core infra — managed model endpoints, **vector databases**, and **GPU instances**. Learn what they are and how they're provisioned.
- **✅ Checkpoint:** Deploy a small app to your cloud manually (VM + storage + networking), then tear it down.

## 🟢 STAGE 2 — Containers & Kubernetes
- [ ] Docker: images, layers, registries, multi-stage builds
- [ ] Container fundamentals: namespaces, cgroups (the "why")
- [ ] **Kubernetes**: pods, deployments, services, ingress, configmaps/secrets, RBAC
- [ ] Helm charts; kustomize
- [ ] Local clusters: kind / minikube (you already have kind — reuse it)
- 🤖 **AI layer:** Use AI to generate & explain manifests/Helm charts, then debug failing pods by feeding logs to an LLM. Later you'll build an agent that does this automatically.
- **✅ Checkpoint:** Run a multi-service app on a local kind cluster with ingress. Break a pod, diagnose it (with AI help), fix it.

## 🟡 STAGE 3 — Infrastructure as Code (IaC)
- [ ] **Terraform** (industry standard): providers, state, modules, workspaces
- [ ] Config management basics: Ansible
- [ ] IaC best practices: remote state, drift, environments, DRY modules
- 🤖 **AI layer:** AI copilots meaningfully accelerate Terraform/Ansible authoring. Learn to generate modules *and* review AI-written IaC for security/cost mistakes.
- **✅ Checkpoint:** Reproduce Stage 1's manual deploy entirely in Terraform. Destroy & recreate from code.

## 🟡 STAGE 4 — CI/CD & Automation
- [ ] CI/CD concepts: build → test → scan → deploy
- [ ] A pipeline tool: **GitHub Actions** (start here) → GitLab CI / Argo / Jenkins as needed
- [ ] GitOps: **ArgoCD / Flux** (declarative deploys from Git)
- [ ] Artifact registries, environments, promotion, rollbacks
- 🤖 **AI layer:** Self-optimizing pipelines — AI flags flaky tests, suggests improvements, auto-drafts release notes and PR summaries.
- **✅ Checkpoint:** Full pipeline: push code → CI builds/tests/scans → GitOps deploys to your kind cluster automatically.

## 🟡 STAGE 5 — Observability & SRE Fundamentals
- [ ] The 3 pillars: **metrics, logs, traces** (Prometheus, Grafana, Loki, OpenTelemetry)
- [ ] **SLI / SLO / error budgets** (the heart of SRE)
- [ ] Alerting, on-call, incident response, blameless postmortems
- [ ] Chaos engineering basics
- 🤖 **AI layer:** **AIOps** (anomaly detection, alert correlation, noise reduction). This is the gateway to Stage 11 (AI SRE).
- **✅ Checkpoint:** Instrument your app with metrics + traces, define an SLO, set an alert, and run a game-day incident with a written postmortem.

## 🟠 STAGE 6 — Security, Supply Chain & FinOps
- [ ] DevSecOps: shift-left scanning (SAST/DAST), container & IaC scanning (Trivy)
- [ ] **Software supply chain security: SBOMs, Sigstore/Cosign** (sign & verify artifacts)
- [ ] Secrets management (Vault), least privilege, policy-as-code (OPA/Kyverno)
- [ ] **FinOps:** cost visibility in PRs (**Infracost**), rightsizing, budgets/guardrails
- 🤖 **AI layer:** AI scans code/containers/cloud configs continuously; **learn AI-specific risks** — prompt injection, over-privileged agent tools, self-modifying agents (this is where your DevOps risk instinct is elite).
- **✅ Checkpoint:** Add scanning + artifact signing + an Infracost cost check to your Stage 4 pipeline.

## 🟠 STAGE 7 — Platform Engineering (the 2026 senior differentiator)
- [ ] What an **Internal Developer Platform (IDP)** is; platform-as-a-product mindset
- [ ] **Backstage** (developer portal) + service catalog + software templates
- [ ] **Golden paths** / self-service provisioning with guardrails
- [ ] Platform observability + developer experience (DX) metrics
- 🤖 **AI layer:** 73% of platform teams now ship AI assistants into developer workflows, configured with org-specific context (internal docs, approved patterns). The IDP is the *best foundation for safe AI adoption* — guardrails live here.
- **✅ Checkpoint:** Stand up Backstage with a golden-path template that provisions a new service (repo + pipeline + k8s deploy) via self-service.

---

## 🔵 AI TRACK — now you layer real AI/ML engineering onto the infra base

## 🟠 STAGE 8 — AI Foundations (using LLMs)
- [ ] Demystify: AI vs ML vs Deep Learning vs LLM; training vs **inference**; tokens, context window, parameters
- [ ] First API calls (you have an OpenAI key + Node): roles, temperature, **cost per token**, streaming
- [ ] Prompt engineering; **structured/JSON output** (the key to automation)
- [ ] Why models hallucinate & what it means for reliability
- 🤖 **This whole stage is AI.** Keep the DevOps lens: watch the token meter like you'd watch a cloud bill.
- **✅ Checkpoint:** A Node CLI that calls an LLM, returns structured JSON, and prints token cost per call.

## 🟠 STAGE 9 — AI for Ops: RAG, Tool-Calling & Agents
- [ ] **RAG**: embeddings, vector DBs, chunking, retrieval — answer questions over *your* runbooks/logs
- [ ] **Tool/function calling** — the agent loop, written by hand once so it's not magic
- [ ] **MCP (Model Context Protocol)** — the 2026 standard ("USB-C for agents"); connect agents to GitHub, k8s, Slack, DBs via MCP servers
- [ ] Multi-step agents: planning, retries, self-correction, memory
- [ ] Reference specimen: **OpenClaw** (local agent w/ shell/file/browser tools) — install & read its source *after* you've built the loop; analyze its security surface
- 🤖 **DevOps framing:** every agent tool = a privileged action. Whitelist, sandbox, gate.
- **✅ Checkpoint:** An agent (with an MCP server) that reads a failing pod's logs and proposes a fix — read-only tools, human approval before any action.

## 🔴 STAGE 10 — LLMOps / AgentOps ⭐ (your home-turf superpower)
- [ ] Deploy & containerize an AI service; serve a **RAG pipeline on Kubernetes/EKS** (the new foundational project for the role)
- [ ] **Observability for LLMs**: OpenTelemetry for LLM calls, tracing via **LangSmith / Langfuse**
- [ ] **Eval-driven development**: automated tests for non-deterministic output, run in CI
- [ ] Cost control, caching, rate limiting, fallbacks, prompt/model versioning
- [ ] Governance & security: prompt-injection defense, PII handling, guardrails
- **✅ Checkpoint:** RAG service on your cluster with tracing, an eval suite in CI, a cost dashboard, and a caching layer.

## 🔴 STAGE 11 — AI SRE & Agentic Infrastructure (frontier)
- [ ] **AI SRE**: autonomous alert triage, root-cause investigation, postmortem generation
- [ ] Bounded/guarded **auto-remediation** within a policy envelope
- [ ] Agent-to-agent (A2A) coordination, multi-agent orchestration
- [ ] Human-in-the-loop design & audit logging for autonomous actions
- 🤖 Gartner: 85% of enterprises using AI SRE tooling by 2029 (from <5% in 2025). This is the high-value frontier.
- **✅ Checkpoint:** An agent that watches an alert → diagnoses → proposes remediation → applies it *only after approval*, with a full audit trail.

---

## 🏁 CAPSTONE (portfolio piece)
**Build a mini "AI-driven platform":** an IDP golden path (Backstage) that provisions a service (Terraform + k8s + CI/CD) **and** wires in an incident-copilot agent — reads pod logs, retrieves matching runbooks (RAG over your docs), suggests a fix (agent + MCP tools), fully containerized, traced (Langfuse), cost-capped, and gated by human approval. This single project touches every stage and is a standout in interviews.

---

## 🎓 CERTIFICATION TRACK (map to roles — do alongside hands-on, not instead of)
1. **Cloud foundation:** AWS Solutions Architect Associate (or Azure AZ-104 / GCP ACE)
2. **Kubernetes:** **CKA** (single most valuable DevOps cert 2026) → then CKAD / **CKS** (security)
3. **IaC:** **HashiCorp Terraform Associate**
4. **Cloud DevOps pro (match your employer's cloud):** AWS DevOps Pro (DOP-C02) / Azure **AZ-400** / **GCP Professional Cloud DevOps** (best for SRE — SLIs/SLOs/error budgets)
5. **Emerging:** platform engineering & AI/LLMOps certs (newer, watch this space)

> Strongest 2026 combo for these roles: **CKA + Terraform Associate + a cloud DevOps Pro cert**, backed by real projects.

---

## 🧰 MODERN TOOL CHEAT-SHEET (where each lands)
| Tool / concept | Category | Stage |
|---|---|---|
| Docker, Kubernetes, Helm, kind | Containers/orchestration | 2 |
| Terraform, Ansible | IaC / config | 3 |
| GitHub Actions, ArgoCD, Flux | CI/CD, GitOps | 4 |
| Prometheus, Grafana, OpenTelemetry, Loki | Observability | 5 |
| Trivy, Cosign/Sigstore, Vault, OPA, Infracost | Security / supply chain / FinOps | 6 |
| Backstage | Internal Developer Platform | 7 |
| OpenAI/Claude APIs, prompt eng. | LLM foundations | 8 |
| Vector DBs, RAG, **MCP**, agent frameworks | AI for ops | 9 |
| LangSmith, Langfuse, OTel-for-LLMs, evals | LLMOps/AgentOps | 10 |
| AI SRE tools, auto-remediation, A2A | Agentic infra | 11 |
| Ollama / vLLM | Local model runtime | 9–10 |
| **OpenClaw** | Personal agent app (reference specimen) | 9 |

---

*Pace: each stage = a short "explain it like I know infra but not AI" lesson → one hands-on → a checkpoint before moving on. We never advance until it clicks.*
