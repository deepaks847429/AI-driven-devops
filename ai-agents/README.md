# 🧠 Agentic AI — From Scratch to Enterprise (2026)

A standalone, zero-to-advanced path for learning **agentic AI**: how to *build* AI agents, from "what even is an agent" up to enterprise-grade, production, multi-agent systems.

> **Companion file:** [`../ROADMAP.md`](../ROADMAP.md) is the DevOps/Cloud/SRE/Platform career roadmap. This file is the deep-dive on *building* agents. They overlap but this one stands on its own — start here if you just want agentic AI.

**How to use:** top-to-bottom. Don't skip a Part until its ✅ checkpoint works. Tick the boxes as we go. Each Part = concept → why it matters → hands-on checkpoint.

**The one truth to anchor everything:**
> An **agent** = an **LLM** + **tools** it can call + a **loop** that feeds each tool's result back in, repeating until a goal is met. Everything else (frameworks, multi-agent, enterprise governance) is layers on top of this one idea.

**The 2026 reality that defines the job:** 79% of enterprises have adopted AI agents, but **only ~11% run them in production**. That 68-point gap is not a model problem — it's an **architecture, evaluation, and governance** problem. Learning to close that gap *is* the skill that pays.

---

## 🟢 PART 0 — What is an agent? (absolute basics, zero assumed)
- [ ] What an **LLM** is: a text-in → text-out function; **tokens**, **context window**, **inference** (running it) vs training (building it)
- [ ] Why a plain LLM **can only talk, not act** — it's a brilliant consultant with no hands
- [ ] **Plain LLM vs Agent:** one-shot answer vs. a loop that takes actions and observes results
- [ ] The **agent loop**: goal → model picks a tool → your code runs it → result goes back → repeat → done
- [ ] Why agents are **non-deterministic** (same input can vary) and what that means for reliability
- **✅ Checkpoint:** Explain the agent loop in your own words and sketch it on paper.

## 🟢 PART 1 — Talk to an LLM (the API layer)
- [ ] Make your first API call (OpenAI / Anthropic). Roles: `system`, `user`, `assistant`
- [ ] Control knobs: **temperature**, max tokens, and **cost per token** (watch the meter)
- [ ] **Structured output (JSON)** — the single feature that makes automation possible
- [ ] Streaming responses
- [ ] Prompt engineering basics: clear instructions, few-shot examples, system prompts
- **✅ Checkpoint:** A script that calls an LLM, returns validated JSON, and prints token cost per call.

## 🟢 PART 2 — Give the agent hands (tool calling + the loop by hand)
- [ ] **Function / tool calling:** how the model *asks* to run a function and you return the result
- [ ] Write the **agent loop yourself** (no framework) — this is the core skill; do it once so it's never magic
- [ ] Design good tools: clear names, typed inputs, helpful error messages back to the model
- [ ] Guardrails from day one: whitelisted/read-only tools, approval before anything destructive
- **✅ Checkpoint:** A hand-written agent that uses 2–3 tools (e.g. read a file, do math, call an API) and loops until done.

## 🟡 PART 3 — Knowledge & memory (RAG + state)
- [ ] **RAG (Retrieval-Augmented Generation):** give the model *your* data instead of relying on its training
- [ ] **Embeddings** and **vector databases** (Qdrant / Pinecone / Weaviate / Chroma)
- [ ] Chunking, retrieval, **hybrid search**, and **reranking** for quality
- [ ] Evaluate retrieval quality with **RAGAS**
- [ ] **Memory architectures:** short-term (conversation), long-term (vector store), episodic — what makes an agent feel persistent
- [ ] Graph memory (Neo4j / Memgraph) for relationships
- **✅ Checkpoint:** An agent that answers questions over your own docs (RAG) and remembers facts across sessions.

## 🟡 PART 4 — Agent design patterns (the craft)
- [ ] **ReAct** (reason + act interleaved) — the classic pattern
- [ ] **Planner–Executor** — one part plans steps, another executes them
- [ ] **Reflection / self-critique** — the agent reviews and improves its own output
- [ ] **Tool-use & RAG-as-a-tool** patterns; **MCP** for standardized integrations
- [ ] **Operating patterns:** retries, fallbacks, failure recovery, **human-in-the-loop (HITL)** escalation
- **✅ Checkpoint:** Implement Planner–Executor **+** Reflection by hand and see the quality jump vs. a one-shot agent.

## 🟠 PART 5 — Frameworks (stop reinventing the loop)
Now that you've built it by hand, adopt a framework — you'll understand exactly what it hides.
- [ ] **LangGraph** — the 2026 production default; graph of nodes/edges → maps cleanly to audit trails & rollback points
- [ ] **CrewAI** — fastest for role-based multi-agent prototypes
- [ ] **OpenAI Agents SDK / Claude Agent SDK** — best when you have a single agent + 1–2 tools (no framework tax)
- [ ] Aware of: Google ADK, Microsoft Agent Framework (AutoGen is now maintenance mode)
- [ ] **MCP (Model Context Protocol)** — the "USB-C for agents"; connect to GitHub, Slack, DBs, files via MCP servers
- **✅ Checkpoint:** Rebuild your Part 4 agent in LangGraph with checkpointing; connect one real tool via MCP.

## 🟠 PART 6 — Multi-agent orchestration
- [ ] Why multiple specialized agents beat one do-everything agent
- [ ] Orchestration patterns: **hierarchical** (supervisor → sub-agents), **peer-to-peer**, **blackboard**, **marketplace**
- [ ] **A2A (agent-to-agent)** coordination protocols
- [ ] Sandboxed code execution for agent-generated code: **E2B / Modal**
- [ ] Shared state, message passing, and avoiding infinite loops between agents
- **✅ Checkpoint:** A supervisor agent that delegates to 2+ specialist agents (e.g. researcher + writer + reviewer).

## 🔴 PART 7 — Evaluation & reliability (the make-or-break skill)
> Teams that ship reliable agents spend **20–30% of effort on evaluation**; teams that fail spend 0–5%. This Part is what separates the 11% who reach production.
- [ ] Treat **evaluation as a first-class system**, not an afterthought
- [ ] Build eval datasets; **LLM-as-judge** and **judge calibration**
- [ ] Regression suites that run in **CI** (block quality drops before deploy)
- [ ] **Tracing & observability:** Langfuse / Phoenix / Helicone — see every step, token, and cost
- [ ] Reliability techniques: guardrails, bounded autonomy, recovery, timeouts
- **✅ Checkpoint:** An eval harness (dataset + judge + CI gate) that fails the build when your agent regresses.

## 🔴 PART 8 — Production & enterprise (deployment + governance)
> Integration + governance consume up to **60% of enterprise agent budgets.** This is where careers are made.
- [ ] Deploy & scale: containerize the agent, serve it (often on Kubernetes), manage secrets
- [ ] **Security:** prompt-injection defense, tool least-privilege, PII/data boundaries, sandboxing
- [ ] **Governance & audit:** log every action with a traceable reasoning chain (compliance must see *why* an agent acted)
- [ ] **Regulation:** EU AI Act (in effect **Aug 2026**, fines up to 7% of global turnover) — know what applies to your use case
- [ ] **Cost governance:** caching, model routing/fallbacks, budgets, avoiding vendor lock-in
- [ ] **Rollout discipline:** start with ONE narrow workflow with a tolerant failure mode → instrument heavily → expand. Never launch fully-autonomous org-wide in week one.
- **✅ Checkpoint:** Take one agent to "production-ready": guardrails + HITL + audit logging + eval gate + cost cap + a written governance/risk note.

---

## 🔨 PROJECT LADDER (theory alone won't get you hired — ship these)

Build in order; each tier reuses the last. **Ship every project to GitHub** with a README, a short demo (GIF/loom), and — from Tier 3 on — eval results. That repo *is* your portfolio.

### Tier 1 — Foundations (Parts 1–2)
1. **Token-metered CLI chatbot** — multi-turn chat that prints tokens + $ cost per message. *Learns: API, roles, cost.*
2. **Multi-tool assistant (hand-written loop)** — calculator + file reader + one web/API tool, no framework. *Learns: tool calling, the loop.*

### Tier 2 — Knowledge & Memory (Part 3)
3. **"Chat with your docs" (RAG)** — Q&A over a folder of PDFs/markdown, with **cited sources**. *Learns: embeddings, vector DB, retrieval.*
4. **Personal assistant with memory** — remembers preferences/facts across sessions. *Learns: memory architectures.*

### Tier 3 — Patterns & single-agent apps (Parts 4–5)
5. **Research assistant with reflection** — searches, drafts, **self-critiques**, revises. *Learns: Reflection, Planner-Executor.*
6. **Text-to-SQL data analyst** — natural language → SQL over a real database, read-only & guarded. *Learns: guarded tools, structured output.*
7. **AI code-review agent** — reviews a PR diff, posts structured findings. *Learns: framework adoption (LangGraph), real integration.*

### Tier 4 — Multi-agent & MCP (Parts 5–6)
8. **Content pipeline crew** — researcher → writer → editor hand-off (CrewAI/LangGraph). *Learns: hierarchical orchestration.*
9. **GitHub/Slack ops agent via MCP** — triages issues, drafts replies through MCP servers. *Learns: MCP, real-world tools, A2A.*

### Tier 5 — ⭐ INDUSTRY-GRADE / ENTERPRISE (Parts 7–8) — portfolio + interview gold
> **Non-negotiable for this tier — what makes them "industry-grade" not toys:** each MUST ship with an **eval suite in CI**, **tracing** (Langfuse), **guardrails**, **human-in-the-loop** escalation, **audit logging**, a **cost cap**, and a one-page **governance/risk note**. That checklist is exactly the 11%-in-production gap.

10. **Enterprise Customer-Support Agent** — RAG over a KB + tools (order/account lookup) + HITL escalation when confidence is low. *Mirrors the #1 recommended "narrow, tolerant-failure" enterprise starter.* Stack: LangGraph + vector DB + Langfuse + eval set.
11. **AI SRE Incident Copilot** 🔧 *(ties directly to your DevOps career)* — ingests an alert + pod logs/metrics, does root-cause analysis, **proposes** a remediation, applies it **only after human approval**, writes the postmortem, logs every step. Stack: MCP (kubectl/Prometheus) + LangGraph + audit trail.
12. **Document Intelligence Pipeline** — extract + classify invoices/contracts, route low-confidence items to a **human review queue**, full compliance logging. *Regulated-industry favorite.* Stack: structured extraction + eval on a labeled set + audit DB.
13. **Autonomous Research & Report Generator** — multi-source, **cited**, factuality-checked, eval-scored before delivery. Stack: multi-agent + reranking + LLM-judge eval.
14. **Internal Developer Platform (IDP) Assistant** 🔧 — self-service agent that scaffolds a new service (repo + pipeline + k8s) and answers infra questions via MCP, all guardrailed. *Bridges agentic AI + platform engineering — a rare, high-value combo.*

---

## 🏁 CAPSTONE (the crown)
Take **one Tier-5 project** all the way to production-ready and polish it as your headline portfolio piece — e.g. the **AI SRE Incident Copilot** or **Enterprise Support Agent**: RAG knowledge, tools via MCP, self-critique (reflection), HITL escalation, traced (Langfuse), gated by a CI eval suite, cost-capped, and fully audit-logged. This single project demonstrates every Part 0–8 and is what you demo in interviews.

> **Interview tip:** be ready to explain your **eval strategy** and **guardrails/governance** for the capstone — in 2026 that's what senior interviewers probe, far more than "which framework did you use."

---

## 🧰 Tool cheat-sheet (where each thing lands)
| Tool / concept | Category | Part |
|---|---|---|
| OpenAI / Anthropic APIs, structured output | LLM basics | 1 |
| Function/tool calling, the agent loop | Core mechanic | 2 |
| Qdrant, Pinecone, Weaviate, Chroma, Neo4j | Vector / graph memory | 3 |
| RAGAS, reranking, hybrid search | Retrieval quality | 3 |
| ReAct, Planner-Executor, Reflection | Design patterns | 4 |
| LangGraph, CrewAI, OpenAI/Claude Agent SDK | Frameworks | 5 |
| MCP, A2A | Integration / coordination | 5–6 |
| E2B, Modal | Sandboxed code execution | 6 |
| Langfuse, Phoenix, Helicone, LLM-judge | Eval & observability | 7 |
| EU AI Act, audit trails, HITL, prompt-injection defense | Governance & security | 8 |

## 🗣️ Language note
The agentic ecosystem is **Python-first** (LangGraph, CrewAI, most tooling). You know Node — great for Parts 1–2 and for production services — but plan to pick up **Python** around Part 3–5 where the ecosystem lives.

## 📌 Golden rules
1. **Build the loop by hand before touching a framework** (Part 2) — otherwise everything stays magic.
2. **Evaluation and governance are the job**, not the model — that's the 11%-in-production gap.
3. **Start narrow, guardrail everything, expand slowly.** Autonomy earns trust; it isn't granted on day one.

---

*Pace: each Part = a short "explain it simply" lesson → one hands-on → a checkpoint before advancing. We never move on until it clicks.*
