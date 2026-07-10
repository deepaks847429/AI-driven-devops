# Part 0 — What Is an Agent? (from absolute scratch)

> Goal of this module: understand *conceptually* what an LLM is, why it can't act on its own, and what turns it into an "agent." **No code yet** — this is the mental model everything else is built on. The checkpoint is simply: *explain the agent loop in your own words.*

---

## 1. What is an LLM?

**LLM = Large Language Model.** Strip away the hype and it's one thing:

> A function that takes **text in** and produces **text out**, one small piece at a time.

That's it. You give it some words, it predicts the next most-likely chunk of words, over and over, until it stops.

**DevOps analogy:** think of it like a very sophisticated autocomplete, or a stateless HTTP service — you `POST` some text, you get text back. It doesn't remember the last request unless you resend the history. (This "statelessness" matters a lot later.)

### Key words you must own

| Term | Plain meaning | Analogy |
|---|---|---|
| **Token** | A chunk of text (~¾ of a word). Models read/write in tokens, and you **pay per token**. | Like billable API units or data transfer — watch the meter. |
| **Context window** | The max amount of text (tokens) the model can "see" at once — input + output combined. | RAM for the conversation. Overflow it and the oldest stuff falls out. |
| **Parameters** | The billions of learned numbers ("weights") that make up the model. | The compiled binary's internals — fixed after training. |
| **Training** | The rare, expensive process of *building* the model from massive data (GPU farms, months). | Compiling/building the software. Done by a few big labs. |
| **Inference** | *Running* the trained model to get an answer. This is what you do every API call. | Running the service in production. **This is your world.** |

> 🔑 **Training vs Inference is the single most clarifying idea for a DevOps person.** You will almost never train a model. You will constantly run inference — deploy it, scale it, secure it, monitor its cost. That's operating a service, which you already know how to do.

---

## 2. Why a plain LLM can only *talk*, not *act*

Ask a plain LLM: *"Restart the crashed pod in the checkout namespace."*

It replies: *"Sure! You should run `kubectl rollout restart deploy/checkout -n checkout`."*

Notice what happened: **it gave you words. It did not touch your cluster.** It can't. A raw LLM has:
- ❌ no hands (can't run commands)
- ❌ no eyes (can't see your systems)
- ❌ no memory of past turns (stateless)
- ✅ only a mouth (produces text)

**Analogy:** it's a brilliant senior consultant **locked in a soundproof room** with no phone, no laptop, no internet. Ask anything and you get world-class *advice* — but they can't *do* anything for you. They can only talk through the door.

---

## 3. Plain LLM vs Agent

The leap from "advice machine" to "does work" is the whole game:

| | **Plain LLM** | **Agent** |
|---|---|---|
| What it does | Answers once, then stops | Takes actions, sees results, decides next step, repeats |
| Nature | A `man` page / a consultant behind a door | A junior engineer you gave a runbook + shell access |
| Can it run `kubectl`? | No — it just tells you the command | Yes — it runs it, reads the output, runs the next one |
| Shape | One question → one answer | Goal → many steps → done |

**An agent = the same LLM brain, but now wired to tools and a loop that lets it act and react.**

---

## 4. The Agent Loop (the heart of everything)

This is *the* idea. Memorize this loop — every agent, framework, and enterprise system is just this with more layers:

```
        ┌─────────────────────────────────────────────┐
        │                                             │
        ▼                                             │
   ┌─────────┐    ┌──────────┐    ┌─────────────┐    │
   │  GOAL   │───▶│  MODEL   │───▶│  YOUR CODE  │────┘
   │ (task)  │    │ decides: │    │ runs the    │
   └─────────┘    │ "call    │    │ tool, gets  │
                  │  tool X" │    │ a result    │
                  └──────────┘    └─────────────┘
                       ▲                 │
                       │   result fed    │
                       └─────────────────┘
                     (repeat until model says "DONE")
```

Step by step, with a DevOps example — goal: *"Find out why checkout is down and fix it."*

1. **You give a goal:** "Find out why checkout is down and fix it."
2. **Model thinks, picks a tool:** "Run `kubectl get pods -n checkout`."
3. **Your code runs the tool** and captures the output: `checkout-abc  CrashLoopBackOff`.
4. **You feed the result back** into the model.
5. **Model decides the next step:** "Run `kubectl logs checkout-abc -n checkout`."
6. **Loop repeats** — read logs → spot bad env var → propose fix → (with approval) apply it.
7. **Model says "DONE"** and summarizes what it did.

> 🔑 The magic isn't the model being smart in one shot. The magic is the **loop**: act → observe → adjust → repeat. That feedback cycle is what makes it feel autonomous.

**Three ingredients, always:**
1. **An LLM** (the brain that decides)
2. **Tools** (functions it's allowed to call — your code)
3. **A loop** (that runs the tool and feeds the result back)

Remove any one and it's not an agent. No tools = just a chatbot. No loop = a one-shot answer.

---

## 5. Why agents are non-deterministic (and why you should care)

Run the same script twice in Bash → same result. Ask an LLM the same question twice → you might get **two different answers**. This is **non-determinism**, and it's a fundamental property, not a bug.

**Why it matters (DevOps lens):**
- You can't write a simple `assert output == "exactly this"` test. You need **evaluation** (checking *quality*, not exact match) — that's a whole skill later (Part 7).
- An agent might take a slightly different path each run. So **guardrails** matter more than in normal code: whitelisted tools, approval gates, audit logs.
- "It worked in my last test" is weaker evidence than usual. You design for the *range* of behaviors, not one path.

This is exactly why your DevOps instincts (least privilege, blast-radius thinking, observability) are so valuable in AI — they compensate for the model's unpredictability.

---

## ✅ Checkpoint — do this before Part 1

You "pass" Part 0 when you can do these from memory, in your own words:

1. **Define an LLM in one sentence** (text in → text out; tokens; inference vs training).
2. **Explain why a plain LLM can't act** (mouth, no hands/eyes/memory).
3. **Draw the agent loop** on paper: goal → model picks tool → run tool → feed result back → repeat → done.
4. **Name the 3 ingredients** of an agent (LLM + tools + loop).
5. **Say why non-determinism** means we need guardrails + evaluation.

> ✍️ **Your task:** reply in the chat and explain the **agent loop in your own words** (bullet points or a rough sketch is perfect). Once that clicks, we move to **Part 1 — your first real LLM API call.**

---

### TL;DR (one screen)
- An **LLM** is a text-in/text-out function; you run it via **inference** (you won't train it).
- A **plain LLM can only talk** — no hands, eyes, or memory.
- An **agent** = LLM **+ tools + a loop** that lets it act, observe, and adjust until the goal is met.
- Agents are **non-deterministic**, so we lean on **guardrails + evaluation** — your DevOps edge.
