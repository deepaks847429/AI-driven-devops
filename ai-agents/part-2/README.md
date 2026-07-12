# Part 2 — Tool Calling & The Agent Loop

> Revision notes for Part 2. Every concept we discuss is captured here in English with examples, so it's easy to review later. This is the part where an LLM stops being a chatbot and becomes a real **agent**.

## Checklist
- [x] Concept 1 — Tool calling (how the model asks to run a function)
- [x] Concept 2 — The agent loop (multi-step, written by hand)
- [x] Concept 3 — Designing good tools + guardrails
- [x] Project 1 — Calculator agent (hand-written loop, multi-step tool chaining)
- [x] Project 2 — Mini DevOps assistant agent (read-only tools + guardrails)

---

## Concept 1 — Tool Calling

### The core idea
A plain LLM can only produce text — it has no hands. **Tool calling** is the mechanism that lets it *use* functions. But the crucial detail:

> The AI does **not** run any code itself. It only **requests** a tool call ("please run function X with these arguments"). **Your code** actually runs the function and sends the result back. The AI **decides**; your code **executes**.

This split is also a safety feature — you stay in control of what actually runs.

### How it works (weather example)
Suppose we give the AI one tool: `getWeather(city)`.

```
1. We TELL the AI: "You have a tool getWeather(city) that returns a city's weather."
2. User asks: "What's the weather in Delhi?"
3. The AI does NOT answer directly. It sends a REQUEST:
       -> call getWeather with { city: "Delhi" }
4. OUR code runs it:  getWeather("Delhi")  ->  "35°C, sunny"
5. We send that result BACK to the AI.
6. The AI writes the final answer: "It's 35°C and sunny in Delhi."
```

The AI chose the tool; our code ran it. One request/response round-trip happened in the middle.

### What we give the AI for each tool
- **name** — e.g. `getWeather`
- **description** — what it does (the AI uses this to decide *when* to call it)
- **parameters** — the inputs it needs (e.g. `city`)

When the AI wants to use a tool, the response contains a **`tool_calls`** object (instead of plain text) describing which tool and which arguments.

### One-line summary
**Tool calling = the AI names a function + arguments to run; you run it and return the result. The AI decides, your code executes.**

---

## Concept 2 — The Agent Loop

### Why one round-trip isn't enough
Real tasks need multiple steps, and the AI can't know in advance how many. Example goal:

> "Find out why checkout is down and suggest a fix."

The AI might need to: (1) list pods, (2) read logs of the failing pod, (3) describe the pod, and only *then* answer. It decides each next step **after seeing the previous result**. That requires a **loop**.

### The idea
> Call the model. If it requests a tool, run it and feed the result back, then call the model **again**. Repeat until the model stops requesting tools and returns a final answer.

### The loop (pseudocode)
```
messages = [ system_prompt, user_question ]

loop:
    response = call_model(messages, tools)      # ask the AI

    if response has tool_calls:                 # AI wants to use a tool
        add response to messages                # remember what the AI asked
        for each tool_call:
            result = run_tool(name, arguments)  # OUR code runs it
            add result to messages              # feed the result back
        continue loop                           # go again; AI now sees results

    else:                                        # AI gave a normal answer
        return response                          # DONE - no tool needed
```

### Line-by-line
- **messages** — the whole conversation. The LLM is stateless, so we keep appending everything (the AI's requests *and* the tool results).
- **call_model** — ask the AI, passing the list of available tools.
- **if tool_calls** — the AI asked for a tool; we run it and append the result.
- **continue** — ask the AI again; now it has new information to decide the next step.
- **else** — the AI answered normally (no tool) -> the task is complete, stop the loop.

### Stopping condition
The loop stops when the AI **stops requesting tools** and returns a plain answer. The AI itself decides "I have enough now, here is the final answer."

### The three ingredients (from Part 0)
```
1. LLM    -> call_model(...)          (the brain that decides)
2. Tools  -> run_tool(name, args)     (the hands that act)
3. Loop   -> the loop itself          (act -> observe -> repeat)
```
All three present -> it's an **agent**. Remove any one -> it's just a chatbot.

### Connection to Part 0
This pseudocode is exactly the Part 0 diagram, now in code:
`GOAL -> MODEL picks tool -> YOUR CODE runs it -> result fed back -> (repeat) -> DONE`

---

## Concept 3 — Designing Good Tools + Guardrails

Two parts: (a) design tools well so the AI uses them correctly, and (b) add guardrails so the AI can't cause damage.

### (a) Good tool design
The AI understands a tool from its **description** — so the description is effectively documentation written for the AI.

| Rule | Why |
|---|---|
| Clear name (`get_pod_logs`, not `gpl`) | The AI infers purpose from the name |
| Good description | The AI uses it to decide *when* to call the tool |
| Well-described parameters | The AI knows exactly what inputs to pass |
| Return helpful errors | On failure, tell the AI *why* (e.g. "Error: pod not found") so it can adjust |
| One tool = one job | Focused tools reduce confusion |

**Key:** if a tool fails, send the error message **back** to the AI. It reads the error and changes its next step — just like a human reacting to an error.

### (b) Guardrails
Once the AI has tools that touch real systems, it has a **blast radius**. The AI is non-deterministic and can be manipulated (prompt injection), so guardrails are not optional. Six core patterns:

```
1. LEAST PRIVILEGE   -> give only the tools that are needed, nothing more
2. READ-ONLY FIRST   -> start with read tools (get/list) before write/delete
3. WHITELIST         -> for a "run command" tool, allow only specific safe
                        commands (never arbitrary shell)
4. VALIDATE ARGS     -> check the AI's arguments before running (never trust blindly)
5. APPROVAL GATE     -> for destructive/irreversible actions, require human
                        approval first (Human-in-the-loop / HITL)
6. LOOP LIMIT + AUDIT-> cap max iterations (avoid runaways) + log every tool call
```

**Example — a `run_command` tool:**
- Bad: the AI can run any command, including `rm -rf /`. Disaster.
- Good: only whitelisted read-only commands (`kubectl get`, `kubectl logs`, `docker ps`); destructive commands are blocked or require human approval.

This is the DevOps mindset (least privilege, blast radius, audit logs) applied to AI — and it's exactly where an infra background gives an edge.

### One-line summary
**Good tools = clear name/description/errors. Guardrails = least privilege, read-only first, whitelist, validate, approval gate for destructive actions, loop limit + audit. The AI decides what to do; you decide what it's *allowed* to do.**

---

## Projects

### Project 1 — Calculator Agent ✅
**Folder:** `project-1-calculator-agent/` · **Run:** `npm run agent`

A hand-written agent loop with four tools (`add`, `subtract`, `multiply`, `divide`). Given a word problem, the AI chains tool calls on its own until it reaches the answer.

**The three parts of the code:**
1. **Tools** — each described with a name, description, and typed parameters, so the AI knows what exists and when to use it.
2. **Dispatcher** (`runTool`) — our code that actually runs the requested function and returns a result (with a helpful divide-by-zero error).
3. **The loop** — ask the model; if it returns `tool_calls`, run them and append `{ role: 'tool', tool_call_id, content }` back to `messages`, then loop again; if it returns a plain message, stop.

**Observed run** — task "Add 25 and 17, then multiply by 3, then subtract 6":
```
[turn 1] add(25, 17) = 42
[turn 2] multiply(42, 3) = 126
[turn 3] subtract(126, 6) = 120
Final answer: 120
```
The AI decided the order of steps itself — we only supplied the tools and the goal.

**Key takeaways:**
- The AI plans and sequences the steps; our code only executes.
- Each turn is act -> observe -> decide, exactly the Part 0 loop.
- Guardrail used: `MAX_TURNS` caps the loop so it can never run forever.
- Important API detail: the assistant's `tool_calls` message must be pushed to `messages` **before** the matching `tool` result messages.

### Project 2 — Mini DevOps Assistant Agent ✅
**Folder:** `project-2-devops-agent/` · **Run:** `npm run agent`

An agent that investigates a **simulated** cluster to find and diagnose a failure. Same loop as Project 1, but the tools return **information** (not numbers), so the AI must reason across steps.

**Tools & guardrails:**
- `list_pods` (read-only) and `get_pod_logs` (read-only) — run freely.
- `restart_pod` (destructive) — sits behind a **human approval gate** (HITL). It only runs after a `y/n` prompt; in a non-interactive shell it auto-denies (safe default).
- Every tool call is recorded in an **audit log** printed at the end (traceability).
- `MAX_TURNS` caps the loop.

**Observed run** — task "Something is wrong, investigate and fix":
```
[turn 1] list_pods()            -> checkout-xyz: CrashLoopBackOff
[turn 2] get_pod_logs(checkout-xyz) -> "DB_HOST is not set"
REPORT: root cause = missing DB_HOST env var; fix it, then restart.
```

**Key takeaways:**
- Real investigation: the AI chose to inspect the *specific* failing pod after seeing its status — reasoning across tool results, not a fixed script.
- Two layers of safety: the AI itself asked before the destructive action **and** the code has a hard approval gate as a backstop. In production you never rely on the model's judgment alone — the hard gate always stays.
- Read-only vs destructive separation is the practical form of "least privilege".

---

## ✅ Part 2 complete
We can now build a real agent by hand: tool calling + the loop + good tools + guardrails, proven with two working projects. Next up is **Part 3 — Knowledge & memory (RAG + vector databases)**.
