# Part 1 — Talk to an LLM (the API layer)

> 📓 **Living notes.** This file grows as we cover each concept. Concepts already learned are marked ✅; upcoming ones are ⬜.

**Goal of Part 1:** learn how to talk to an LLM from our own code — send messages, control the output, understand cost, and get structured data back.

---

## 📌 Concept checklist
- [x] What an LLM API call is
- [x] Roles: `system`, `user`, `assistant`
- [x] Control knobs: `temperature` and `max_tokens`
- [x] Token usage in the response (link to Part 0)
- [x] Cost calculation (tokens → money)
- [x] Structured output (JSON) — the automation key
- [ ] Prompt engineering basics
- [x] **Checkpoint:** a script that calls an LLM, returns validated JSON, and prints token cost per call

---

## 1. What is an LLM API call?
An LLM is a **stateless HTTP service**: you send text, it runs the model (**inference**), and returns generated text. Calling it from code is just like calling any REST API — send a request, get a response. Because it is **stateless**, it remembers nothing between calls; to give it context you must resend the relevant conversation each time.

We use the official **`openai`** library (SDK) so we don't have to write raw HTTP, and **`dotenv`** to load our secret API key from a `.env` file (never hard-code keys).

## 2. Roles — `system`, `user`, `assistant`
A conversation is a list of messages, each tagged with a **role**:

| Role | Who it represents | Purpose |
|---|---|---|
| `system` | The developer (you) | Sets the AI's persona + rules for the whole conversation. Your most powerful control. |
| `user` | The person asking | The actual question/message. |
| `assistant` | The AI itself | The AI's reply. Also used to feed past answers back so the AI "remembers". |

**Example**
```
system:    "You are a friendly DevOps tutor. Answer briefly in Hinglish."
user:      "What is a Kubernetes pod?"
assistant: "Pod Kubernetes ki sabse chhoti unit hai jisme..."   <- the reply
```

**Key insight:** a good `system` prompt sets tone + behaviour for everything that follows.

## 3. Control knobs — `temperature` and `max_tokens`

### `temperature` (creativity vs predictability)
A number, usually 0–2, that controls randomness:

| Value | Behaviour | Use for |
|---|---|---|
| `0` | Predictable, focused; nearly the same answer every time | Facts, code, data extraction, **automation** |
| `~0.7` | Balanced, slightly creative | General chat |
| `1.5+` | Very creative/random, sometimes odd | Brainstorming, stories, ideas |

> This is the knob that controls the **non-determinism** from Part 0. For reliable automation, use **`temperature: 0`**.

### `max_tokens` (output length cap)
A hard limit on how many tokens the **reply** can use. Smaller = cheaper + faster, but the answer can get cut off mid-sentence. It is a cost/safety guard.

## 4. Token usage (link to Part 0)
Every response includes a `usage` object:

| Field | Meaning |
|---|---|
| `prompt_tokens` | Tokens in your input (system + user messages) |
| `completion_tokens` | Tokens in the AI's reply |
| `total_tokens` | Sum of both — this is what you are billed on |

This is the same "token" concept from Part 0, now visible on a real API call.

## 5. Structured Output (JSON)
Plain-text answers are great for humans but useless for programs — code cannot reliably pull fields out of a free-form paragraph. **Structured output** means asking the AI to return **JSON** (key–value data) that code can use directly. This is the feature that turns an LLM from a chatbot into an automation tool.

**Example — messy text in, clean data out:**
```
"Senior DevOps Engineer at Acme, must know Kubernetes and Terraform, 5+ years, remote"
```
becomes
```json
{ "role": "Senior DevOps Engineer", "company": "Acme", "skills": ["Kubernetes", "Terraform"], "experience_years": 5, "location": "Remote" }
```
Now code can do `data.skills.includes("Kubernetes")` — real automation.

**Three ways to get JSON (worst → best):**
1. Just ask for JSON in the prompt — works, but the model may add stray text. Unreliable.
2. **JSON mode:** `response_format: { type: 'json_object' }` — forces valid JSON. *(This is what we use.)*
3. **Structured Outputs (schema):** pass a JSON schema so the exact fields are guaranteed. Most reliable.

Always use **`temperature: 0`** for extraction so the output is consistent.

**Validate before you trust it — the 3-step pattern:**
1. `JSON.parse(raw)` inside a `try/catch` → turn text into a real object.
2. Check every required field is present.
3. Only then use the data.

## 6. Cost calculation (tokens → money)
Providers charge **per token**, with different rates for input and output, quoted **per 1 million tokens**. Every response's `usage` gives the token counts, so cost per call is:

```
cost = (prompt_tokens / 1,000,000 × input_price) + (completion_tokens / 1,000,000 × output_price)
```

`gpt-4o-mini` (approx): input ~$0.15 / 1M tokens, output ~$0.60 / 1M tokens. *(Prices change — check the provider's pricing page.)*

**Why it matters:** watching cost per call is the DevOps "watch the meter" instinct applied to AI. Learning is cheap — one small call costs a tiny fraction of a cent, so ~20,000+ calls fit in $1.

---

## 🧪 What we built so far

| File | What it does | Run |
|---|---|---|
| `01-first-call.js` | First API call: system + user roles, prints reply + token usage | `npm run chat` |
| `02-knobs.js` | Experiment showing `temperature` (0 vs 1.7) and `max_tokens` effects | `npm run knobs` |
| `03-structured-json.js` | Extract structured JSON from a messy job posting, then parse + validate + use it | `npm run json` |
| `04-checkpoint.js` | **Part 1 checkpoint:** LLM call + validated JSON + per-call cost report | `npm run checkpoint` |

### Observed results
- `temperature: 0` → same question gave the **same** answer twice (`OpsVision`, `OpsVision`).
- `temperature: 1.7` → same question gave **different** answers (`OpsRadar`, `AuditOps Insight`).
- `max_tokens: 15` → the answer was **cut off** mid-sentence.
- JSON extraction → a messy job posting became clean JSON; `data.skills.includes("Kubernetes")` returned `true`. The AI even inferred `AWS` as a skill from "ideally AWS".
- Checkpoint → extracted + validated a second posting and reported cost: 147 tokens = **$0.000047 (~₹0.004)**, i.e. ~21,000 calls per $1.

---

## ⚙️ Setup notes (for reference)
- **Model used:** `gpt-4o-mini` — cheap and fast, ideal for learning.
- **Secret key:** stored in `part1/.env` as `OPENAI_API_KEY=...` (exact name matters; the SDK auto-reads it). `.env` is git-ignored so it is never committed.
- **Dependencies:** `openai`, `dotenv` (installed via `npm install`).

---

## ⏭️ Status & what's next
**Part 1 is essentially complete** — we can talk to an LLM, control it, get validated JSON, and measure cost. ✅

- One light topic left: **prompt engineering** (few-shot examples) — we already use system prompts + clear instructions.
- **Part 2 preview:** *tool calling* + the *agent loop* — giving the AI "hands" so it can take actions, not just return text. This is where it starts becoming an actual **agent**.

*Notes updated as we progress. Definitions in English; live teaching happens in Hinglish.*
