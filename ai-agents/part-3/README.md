# Part 3 — Knowledge & Memory (RAG + State)

> **Interview-ready revision notes.** Each concept is written to be self-contained: a plain definition, why it matters, a simple analogy, the mechanics, and common interview questions with crisp answers. We build this file up concept-by-concept as we learn.

## 🌟 RAG pipeline at a glance (memorize this)
> **Load files → split into chunks → embed chunks (vectors) → store in an index → embed the question → cosine-similarity to find the nearest chunks (top-k) → generate a grounded answer (+ citations).**
>
> Hinglish: *Files padho → tukdon mein todo → tukde embed karo (vectors) → index mein store karo → sawaal aaye to usko embed karo → cosine se sabse paas tukde dhoondho (top-3) → un tukdon se grounded jawab do (+ citations).*

The first four steps are **indexing** (done once, offline); the rest are **querying** (per question).

## Why this part matters
A plain LLM only knows its training data (general knowledge, frozen at a cutoff). It does **not** know your private/most-recent data, and it has **no memory** between calls. Part 3 fixes both:
- **RAG** — give the model *your* data at question time (knowledge).
- **Memory** — let the agent remember things across turns and sessions (state).

## Concept map (what this part covers)
- [x] **Concept 1 — What is RAG** (the open-book idea)
- [x] **Concept 2 — Embeddings & Vector Databases** (how we find relevant text by *meaning*)
- [x] **Concept 3 — Chunking & Retrieval** (splitting docs, top-k, hybrid search, reranking)
- [x] **Concept 4 — Evaluating retrieval** (is the retrieved context actually good? RAGAS)
- [x] **Concept 5 — Memory architectures** (short-term, long-term, episodic)
- [x] **Concept 6 — Graph memory** (relationships via Neo4j / Memgraph)
- [x] **Projects** (mini RAG + memory agent — both built and working)

---

## Concept 1 — What is RAG?

### One-line definition
**RAG (Retrieval-Augmented Generation)** = before the model answers, we **retrieve** the relevant pieces from *your* data and **add** them to the prompt, so the model **generates** its answer from that supplied context instead of from memory alone.

### The problem it solves
An LLM's knowledge is:
1. **Limited to training data** — it never saw your company runbooks, your notes, your codebase, or today's events.
2. **Frozen at a cutoff date** — no new information.
3. **Prone to hallucination** — asked about something it doesn't know, it often invents a confident, wrong answer.

### The solution
Don't rely on the model's memory. **Fetch the relevant text and hand it to the model with the question.** The model then answers grounded in that text.

### Analogy: closed-book vs open-book exam
- **Closed-book (plain LLM):** answers everything from memory — can be wrong or outdated.
- **Open-book (RAG):** we give the model the right page(s) first — it reads and answers accurately.

RAG turns the model into an open-book exam taker, using your documents as the book.

### What the letters mean
```
R - Retrieval   -> find the relevant chunks from your data
A - Augmented   -> inject those chunks into the prompt (alongside the question)
G - Generation  -> the model writes the answer using that context
```

### The flow (end to end)
```
1. User question:  "What is our deploy policy?"
2. RETRIEVE:       search your docs -> "Deploys only on weekdays, 10am-4pm..."
3. AUGMENT:        build a prompt = [retrieved text] + [the question]
4. GENERATE:       model answers -> "You can deploy on weekdays between 10am and 4pm."
```

### Why it matters
- The model can now answer over **your** private/current data.
- **Fewer hallucinations** — answers are grounded in supplied text (and you can show sources/citations).
- **No retraining** — you just supply text at query time; cheap and instant to update (change a doc, the answer changes).

### Key terms
- **Grounding** — forcing the model to answer *from provided context* (e.g. "answer only from the text below; if it's not there, say you don't know").
- **Context** — the retrieved text we paste into the prompt.
- **Knowledge base** — the collection of documents we retrieve from.

### Common interview questions
**Q: What is RAG and why use it?**
A: Retrieval-Augmented Generation. We retrieve relevant documents and add them to the prompt so the model answers from that context. It lets an LLM use private/current data, reduces hallucination, and needs no retraining.

**Q: RAG vs fine-tuning?**
A: RAG *injects knowledge at query time* (easy to update, great for facts/docs that change). Fine-tuning *bakes behavior/style into the model weights* (good for tone, formats, skills), is costlier, and is not the right tool for frequently-changing facts. They're complementary.

**Q: Does RAG eliminate hallucination?**
A: No — it *reduces* it. The model can still misread context or answer beyond it. That's why we add grounding instructions, citations, and evaluation (later concepts).

**Q: What are the two phases of a RAG system?**
A: (1) **Indexing** (offline): prepare documents so they're searchable. (2) **Querying** (online): retrieve relevant pieces for a question and generate an answer. *(We'll detail the "how" of search in Concept 2.)*

---

## Concept 2 — Embeddings & Vector Databases

This concept answers the key RAG question: **how do we find the relevant chunk?** The answer is search by *meaning*, not by keywords.

### The core problem
Keyword search fails when wording differs. "server crashed" and "system went down" share no words, but mean the same thing. We need search by **meaning** — this is called **semantic search**.

### Embeddings
**Definition:** an **embedding** is a list of numbers (a **vector**) that represents the *meaning* of a piece of text. Similar meaning -> vectors close together; different meaning -> far apart.

```
"server crashed"      -> [0.12, -0.88, 0.45, ...]   ┐ close together
"system went down"    -> [0.11, -0.85, 0.47, ...]   ┘ (same meaning)
"aloo paratha recipe" -> [-0.90, 0.32, 0.05, ...]     far away (different meaning)
```

**How does a number "know" meaning?** The embedding model *learned* it from huge amounts of text using one rule: **a word is known by the company it keeps** (distributional semantics). Words that appear in similar contexts ("The server ___ so we restarted it" fits both "crashed" and "went down") get similar vectors. Nobody assigns the numbers by hand — the model learns them during training.

**Embedding model:** a separate, specialized model whose only job is `text -> vector`. It is *not* the chat model. You call it like any API; it returns numbers. Example: OpenAI's `text-embedding-3-small` returns a 1536-number vector. Cheap and fast.

**Dimensions:** the length of the vector (e.g. 1536). More dimensions = more capacity to capture nuance. The exact numbers are meaningless to humans; only *relative distances* matter.

### Measuring similarity (cosine similarity)
Each vector can be seen as an **arrow** pointing in some direction; meaning lives in the *direction*. **Cosine similarity** measures the **angle** between two arrows:

```
same direction (0 deg)   -> cosine = 1    -> very similar
perpendicular  (90 deg)  -> cosine = 0    -> unrelated
opposite       (180 deg) -> cosine = -1   -> opposite meaning
```

Formula: `cosine = (A . B) / (|A| * |B|)` — the dot product (how aligned they are) divided by the two lengths (to normalize).

**Why cosine (direction), not raw distance (length)?** Length is ignored, so a short question and a long paragraph on the same topic still score high — only *meaning direction* matters, not text size.

Tiny 2D example: `A = [2,0]`, `B = [3,0]` point the same way -> cosine `= 6 / (2*3) = 1` (similar despite different lengths). `A = [2,0]`, `C = [0,2]` are perpendicular -> cosine `= 0` (unrelated).

**Why a vector DB fundamentally needs this:** a vector database's whole job is "find the nearest vectors" — but "nearest" is undefined without a way to *measure* closeness. Cosine similarity is that ruler. In our mini-RAG project we wrote it by hand and looped over all chunks; a real vector DB does the exact same thing, just fast at scale (ANN indexing). The in-memory `index` + `cosineSimilarity` + `sort` **is** a tiny vector database.

### Vector databases
**Definition:** a database built to **store vectors** and answer one query extremely fast: *"given this vector, return the stored vectors closest to it"* (**nearest-neighbor search**).

- **Stores:** each chunk's vector **plus** its original text (and metadata like source/section).
- **Does:** given a query vector, returns the **top-k** most similar chunks.
- **Why a special DB?** Scanning millions of vectors for the closest ones needs specialized indexing (e.g. HNSW/ANN); a normal SQL/NoSQL DB can't do meaning-search efficiently.
- **Examples:** Qdrant, Pinecone, Weaviate, Chroma, pgvector.

**Analogy:** a librarian who organizes books by *topic/meaning* rather than title — describe what you want and they instantly hand you the closest matches.

### The two phases (how it all fits)
```
INDEXING (offline, once):
  docs -> split into chunks -> [embedding model] -> vectors -> store in [vector DB]

QUERYING (online, per question):
  question -> [embedding model] -> query vector -> [vector DB] -> top-k closest chunks
           -> put chunks + question in prompt -> [LLM] -> answer
```
Division of labour: the **embedding model makes** the numbers; the **vector DB stores and searches** them.

### Key terms
- **Embedding / vector** — numeric representation of meaning.
- **Semantic search** — search by meaning (vs keyword/lexical search).
- **Cosine similarity** — common way to measure how close two vectors are.
- **top-k** — the k most similar chunks returned by the search.
- **ANN (Approximate Nearest Neighbor)** — the fast (approximate) search technique vector DBs use at scale.

### Common interview questions
**Q: What is an embedding?**
A: A vector (list of numbers) representing the meaning of text, such that semantically similar texts have vectors that are close together.

**Q: How does an embedding capture meaning?**
A: The embedding model learns from large corpora that words/phrases appearing in similar contexts are similar (distributional semantics), placing them near each other in vector space.

**Q: Why not just use keyword search?**
A: Keyword search misses different wording with the same meaning ("crashed" vs "went down") and matches unrelated text that shares words. Semantic search compares meaning, not exact tokens. (In practice, **hybrid search** combines both — Concept 3.)

**Q: What is a vector database and why not a normal database?**
A: A store optimized for nearest-neighbor search over vectors. Normal databases do exact/keyword matches; finding the "closest by meaning" across millions of vectors needs specialized ANN indexing (e.g. HNSW).

**Q: Is the embedding model the same as the chat model?**
A: No. The embedding model only turns text into vectors; the chat/generation model produces answers. They're separate models used at different steps.

**Q: What is cosine similarity and why is it used?**
A: It measures the angle between two vectors (1 = same direction/very similar, 0 = unrelated, -1 = opposite). It's used because it compares *direction* (meaning) and ignores magnitude (text length), and it's the metric a vector DB uses to rank "nearest" results.

## Concept 3 — Chunking & Retrieval

### Chunking
**Definition:** splitting documents into smaller pieces ("chunks") *before* embedding them. Each chunk becomes one embedding and one retrievable unit.

**Why chunk?**
1. **One embedding for a huge document is bad** — the vector becomes an "average" of everything and captures no specific point. Small, focused chunks have sharp meaning.
2. **We want only the relevant part** — retrieve the right paragraph, not the whole 50-page doc.
3. **Context window limits** — a whole document won't fit in the prompt; chunks do.

**Chunk size is a trade-off:**
```
too BIG   -> meaning is diluted; irrelevant text tags along
too SMALL -> context is cut off; the chunk becomes meaningless
```
A common sweet spot is roughly a paragraph (~200-500 tokens). It's tuned empirically.

**Overlap:** consecutive chunks usually overlap slightly (~10-20%) so a sentence/idea isn't split awkwardly at a boundary.

**Strategies:** fixed-size (by tokens), by paragraph/heading (structure-aware), or semantic chunking (split where the topic changes).

> In our mini-RAG the "chunks" were already single lines, so chunking was trivial. With real documents (PDFs, wikis) chunking is a major quality lever.

### Retrieval quality boosters
Basic semantic retrieval (embed -> cosine -> top-k) works, but production systems add:

**top-k** — how many chunks to retrieve (we used k=2). Higher k = more context but more cost and more noise. Tune it.

**Hybrid search** — combine two search types:
- *Semantic* (vector) search — matches meaning, but can miss exact tokens.
- *Keyword/lexical* search (e.g. BM25) — matches exact terms like error codes, names, IDs.
- *Hybrid* fuses both, so "Error 503" is matched exactly **and** by meaning. Best of both.

**Reranking** — a two-step retrieval:
1. Vector DB returns a larger candidate set (e.g. top-10) — fast but rough.
2. A **reranker model** re-scores those candidates more accurately and keeps the best (e.g. top-3).
Pattern: *fast retrieve -> accurate rerank*. Running the accurate scorer over everything would be too costly, so we filter first, then rerank the shortlist.

### Key terms
- **Chunk** — a small piece of a document; one unit of retrieval.
- **Overlap** — shared text between adjacent chunks to preserve context.
- **top-k** — number of chunks returned by retrieval.
- **Hybrid search** — semantic + keyword search combined.
- **Reranker** — a model that re-scores retrieved candidates for better ordering.
- **BM25** — a classic keyword-ranking algorithm often used for the lexical half of hybrid search.

### Common interview questions
**Q: Why do we chunk documents instead of embedding whole files?**
A: A single embedding of a large document averages out all its content and loses specificity; chunking gives focused, retrievable units, lets us return only the relevant part, and fits the context window.

**Q: How do you choose chunk size?**
A: It's a trade-off — too big dilutes meaning and adds noise, too small loses context. Start around a paragraph (~200-500 tokens) with small overlap and tune based on retrieval quality.

**Q: What is hybrid search and why use it?**
A: Combining semantic (vector) and keyword (BM25) search. Semantic captures meaning; keyword captures exact tokens (codes, IDs, names). Together they retrieve more reliably than either alone.

**Q: What is reranking?**
A: A second, more accurate scoring pass over a shortlist of retrieved candidates (retrieve many fast, then rerank to keep the best few). It improves the final context quality.

## Concept 4 — Evaluating Retrieval (RAGAS)

### Why evaluate?
Building a RAG isn't enough — we must know if it's actually *good*. It might retrieve the wrong chunks, miss information, or hallucinate. "You can't improve what you can't measure." We need metrics, not eyeballing.

### What is RAGAS?
**RAGAS (RAG Assessment)** is a framework that **automatically evaluates** a RAG system, scoring it (0-1) on specific quality dimensions using an **LLM-as-judge** (one model scores another's output).

### The 4 core metrics
Two measure **retrieval**, two measure **generation**:

**Retrieval quality:**
1. **Context Precision** — of the retrieved chunks, how many are actually relevant? (Did we pull in junk?)
2. **Context Recall** — did we retrieve *all* the info needed to answer? (Did we miss a relevant chunk?)

**Generation quality:**
3. **Faithfulness** — is the answer grounded in the retrieved context, or did the model invent things? (Hallucination check.)
4. **Answer Relevancy** — does the answer actually address the question, or ramble?

### Example (from our mini-RAG)
```
Question: "When can I deploy?"
Retrieved: [deploy-policy chunk = relevant] + [pod-restart chunk = irrelevant]
Answer:    "weekdays 10am-4pm"

Context Precision: 1 of 2 relevant   = 0.5   (some junk retrieved)
Context Recall:    got the deploy chunk = 1.0 (nothing missed)
Faithfulness:      answer from context = 1.0  (no hallucination)
Answer Relevancy:  answers the question = 1.0
```

### How it works
Give RAGAS the **question + retrieved context + generated answer** (and optionally a reference/ground-truth answer). An LLM-judge scores each metric. Run it over a test set of questions to get average scores.

### Why it's useful (diagnostic)
The scores tell you *where* the problem is:
- Low **Context Recall** -> retrieval is missing info (fix chunking/embeddings).
- Low **Faithfulness** -> the model is hallucinating (fix the grounding prompt).
So you improve systematically instead of guessing.

> Note: RAGAS is a **Python** library (we're on Node), so we don't code it here — but the metrics are universal. Hands-on evaluation comes in **Part 7**, where evaluation is the make-or-break skill.

### Common interview questions
**Q: How do you evaluate a RAG system?**
A: Separate retrieval vs generation. For retrieval: context precision (relevance of retrieved chunks) and context recall (coverage). For generation: faithfulness (grounded, no hallucination) and answer relevancy (on-topic). Tools like RAGAS score these with an LLM-judge over a test set.

**Q: Your RAG gives wrong answers — how do you debug?**
A: Check the metrics. If context recall is low, retrieval missed the info (fix chunking/embedding/top-k). If retrieval is fine but faithfulness is low, the model is ignoring/inventing beyond context (strengthen grounding). This isolates whether it's a retrieval or generation problem.

## Concept 5 — Memory architectures

### The problem
The LLM is **stateless** — it forgets everything between calls. Memory is how we make an agent remember across turns and sessions. Crucially: **the model never remembers; we store memory outside it and re-supply it in the prompt.**

### Short-term memory (conversation history)
- The `messages` array we keep appending — remembers within one session.
- Lives in RAM; when the program/session ends, it's gone.
- Limited by the **context window** (can't grow forever).

### Long-term memory
- Facts that must persist **beyond a session** (name, preferences, past decisions).
- Stored **outside the model, on disk/DB** (a JSON file, a database, or a **vector database**) — so it survives after the program closes.
- Mechanics:
  1. **Save (write):** extract important facts from a conversation and write them to the store.
  2. **Load + inject (read):** next session, load relevant facts and put them in the prompt.
- The model "remembers" only because we retrieved a saved fact and placed it back in context.
- When there are many facts, retrieve only the **relevant** ones via a vector DB (semantic search) — i.e. **long-term memory = RAG over your saved facts** (same embeddings + vector DB machinery).

### Episodic memory
Memory of specific past events/interactions ("last time we discussed X"). A specialized form of long-term memory.

### Managing the context window
History can't grow unbounded (tokens/cost/limits). Strategies:
- **Summarize** old turns into a short running summary.
- **Retrieve** only relevant past facts (vector DB) instead of sending everything.
- **Sliding window** — keep only the last N messages.

### Analogy
- Short-term = notes on your desk during a meeting; meeting ends, thrown away (RAM).
- Long-term = important points written in a notebook in a drawer; reopened next meeting to "remember" (disk).

### Key terms
- **Short-term / working memory** — the in-session conversation history.
- **Long-term memory** — persisted facts in an external store.
- **Episodic memory** — recollection of specific past interactions.
- **Summarization / sliding window** — techniques to keep history within the context window.

### Common interview questions
**Q: LLMs are stateless — how does an agent "remember"?**
A: We store memory outside the model and re-inject it. Short-term = the conversation history array; long-term = facts persisted to a store (file/DB/vector DB) and loaded back into the prompt on later sessions.

**Q: How is long-term memory implemented?**
A: Extract durable facts, save them to a persistent store, and on future turns retrieve the relevant ones (often via a vector DB / semantic search) and inject them into the prompt — essentially RAG over the user's own history.

**Q: The conversation is too long for the context window — what do you do?**
A: Summarize older turns, keep a sliding window of recent messages, and/or move facts to long-term memory and retrieve only what's relevant.

## Concept 6 — Graph Memory

### The gap in vector memory
Vector memory stores facts as separate chunks — great for "find similar text," but it doesn't capture the **relationships** between facts. Each fact is an isolated sticky note; it doesn't know how it connects to the others.

### What is graph memory?
**Definition:** storing memory as a **graph** of **nodes** (entities/things) and **edges** (relationships between them).
- **Node** = an entity (Deepak, AcmeCorp, Kubernetes).
- **Edge** = a labeled relationship (works_at, uses, knows).

### Example
Facts: "Deepak works at AcmeCorp", "AcmeCorp uses Kubernetes", "Deepak knows Terraform".
```
   Deepak --works_at--> AcmeCorp --uses--> Kubernetes
      |
      +----knows----> Terraform
```

### Why it matters: multi-hop questions
Question: "What technology does Deepak's company use?" needs following relationships:
```
Deepak --works_at--> AcmeCorp --uses--> Kubernetes   (2 hops)
```
A graph traces these connected paths easily (**multi-hop reasoning**); flat vector search struggles with it.

### Vector vs graph memory
| | Vector memory | Graph memory |
|---|---|---|
| Stores | isolated facts | connected facts |
| Best at | "find similar text" | "follow relationships" |
| Typical query | "what's like this?" | "how is A related to B?" |

### Tools & terms
- **Neo4j, Memgraph** — graph databases.
- **GraphRAG** — combining a knowledge graph with RAG for relationship-aware retrieval.
- **Multi-hop reasoning** — answering by traversing several connected facts.

### When to use it
When relationships matter: org charts, dependency graphs, knowledge graphs, "who/what connects to what." For plain Q&A, vector memory is usually enough; reach for graphs when connections are the point.

### Common interview questions
**Q: When would you use a knowledge graph instead of a vector store for memory?**
A: When relationships and multi-hop reasoning matter (e.g. "what does Deepak's company use?"). Vector search finds semantically similar text but can't reliably traverse chains of relationships; a graph models nodes and edges explicitly.

**Q: What is GraphRAG?**
A: RAG augmented with a knowledge graph — retrieval can follow entity relationships, not just semantic similarity, improving answers on connected/structured data.

---

## Part 3 complete
We now understand knowledge (RAG: embeddings, vector DBs, chunking, retrieval quality, evaluation) and state (memory: short-term, long-term on disk, graph). Two working projects prove it: an in-memory RAG and a disk-persisted memory agent. Next: **Part 4 — Agent design patterns (ReAct, Planner-Executor, Reflection).**

---

## Projects

### Project 1 — Mini RAG (in-memory) ✅
**Folder:** `project-1-mini-rag/` · **Run:** `npm run rag` or `node mini-rag.js "your question"`

A complete RAG system in plain Node — **no vector database** (vectors are kept in a simple array so every step is visible). Proves Concepts 1 & 2 end to end.

**The 6 pieces:**
1. **Setup** — load `.env`, create the OpenAI client.
2. **Knowledge base** — an array of text chunks (a small fake runbook = our "book").
3. **Indexing** — embed every chunk with `text-embedding-3-small`; store `{ text, vector }` in an in-memory `index`.
4. **Cosine similarity** — a function returning a closeness score (~1 = similar) between two vectors.
5. **Retrieve** — embed the question, score it against every chunk, sort, return the top-k (k=2).
6. **Generate** — put the retrieved chunks in the prompt and have the LLM answer **only** from that context (grounding).

**Observed runs:**
- *"When am I allowed to deploy?"* → retrieved the deploy-policy chunk (score 0.654) → correct answer.
- *"my pod keeps crashing, what do I do?"* → matched the *"restart a **crashed** pod"* chunk (0.534) even though the wording differed ("crashing" vs "crashed") — **semantic search** in action.
- *"what is the capital of France?"* → all scores ~0.08 → answered **"I don't know based on the runbook."** The model knows the real answer but obeyed grounding — this is how RAG controls hallucination.

**Key takeaways:**
- Question and chunks must be embedded with the **same** model to be comparable.
- Retrieval = embed → score by cosine similarity → sort → take top-k.
- **Grounding** (answer only from context, else say "I don't know") is what keeps the agent on your data and limits hallucination.
- The in-memory `index` here is exactly what a real vector DB (Qdrant/Pinecone) does — just at scale and with fast ANN indexing.

### Project 3 — RAG over real files (chunking + citations) ✅
**Folder:** `project-3-rag-real-files/` · **Run:** `node rag-files.js "your question"`

Upgrades the mini-RAG to read **real files** from a `docs/` folder, **chunk** them with overlap, and **cite sources**.

**The 6 code pieces:**
1. **Setup** — imports incl. `fs` (read files) and `path` (build paths).
2. **Read files** — `fs.readdirSync` lists the folder, `fs.readFileSync` reads each file's text.
3. **`chunkText`** — split a big text into ~40-word chunks with ~10-word overlap (so meaning isn't cut at a boundary).
4. **Chunk + embed all** — run `chunkText` on every doc (keeping each chunk's source filename), embed all chunks, build the `index` of `{ filename, text, vector }`.
5. **Retrieve** — same cosine-similarity search, now returns top-3 and carries the filename through.
6. **Generate + cite** — answer only from context, tag each chunk with `[filename]` so the model cites sources; print unique source files.

**Observed runs:**
- 3 files became **10 chunks** (chunking confirmed).
- *"When can I deploy... Fridays?"* → 3 chunks from `deployment.md` → correct answer, cited `[deployment.md]`.
- *"what if on-call doesn't respond?"* → chunks from `oncall.md` → correct escalation answer, cited `[oncall.md]`. Different question picked a different file — semantic search across multiple files.

**Key takeaways:**
- Chunking lets retrieval return the *precise* relevant passage (mid-paragraph), not a whole file.
- Carrying the filename through the pipeline enables **citations** — essential for trust in real RAG.
- This is the same pipeline as the mini-RAG; only "load real files" and "chunk them" were added.

### Project 4 — RAG-as-a-Tool (agentic RAG) ✅
**Folder:** `project-4-rag-as-tool/` · **Run:** `node rag-tool-agent.js "your message"`

Combines **Part 2 (agent loop + tools)** with **Part 3 (RAG)**: retrieval is exposed as a `search_knowledge_base` **tool**, and the **agent decides when to call it**.

**The pieces:**
- *Reused:* setup, knowledge base, embedding index, cosine similarity, `retrieve` (the whole mini-RAG).
- *New 1:* a **tool** `search_knowledge_base(query)` whose **description** tells the AI when to use it; a **dispatcher** (`runTool`) that runs `retrieve()` and returns the chunks.
- *New 2:* the **Part 2 agent loop** — call the model with `tools`; if it returns `tool_calls`, run them and feed results back, else print the final answer.

**Observed runs:**
- *"hi, how are you?"* → **no search** (no tool call); the AI replied directly. It decided the knowledge base wasn't needed.
- *"what is our deploy policy and when are deploys frozen?"* → the AI called the tool **twice** (`"deploy policy"` and `"deploy freeze"`), splitting the question into sub-queries itself, then combined the chunks into one answer.

**Key takeaways:**
- **Agentic RAG:** RAG becomes a tool the model calls *on demand*, not a step that always runs. The tool's **description** is what drives the AI's decision.
- The agent can issue multiple searches (sub-queries) for a compound question — its own planning, not hardcoded.
- This is exactly the Part 2 loop; only the tool it can call is new.

### Project 2 — Memory Agent (long-term, on disk) ✅
**Folder:** `project-2-memory-agent/` · **Run:** `node memory-agent.js "your message"` (run twice to see it remember)

Demonstrates **long-term memory** persisted to disk (`memory.json`) so the agent remembers across separate runs/sessions.

**The 3 steps:**
1. **Load** — read `memory.json` from disk (Node's `fs`); returns `[]` if none yet.
2. **Inject + answer** — put the remembered facts into the system prompt, then answer the message.
3. **Save** — use the LLM (JSON mode) to extract one durable fact and write it back to `memory.json`.

**Observed runs:**
- *Session 1:* memory empty -> user says "I'm Deepak and I prefer Hinglish" -> saved `"Deepak prefers Hinglish explanations."` to disk.
- *(program exits; `memory.json` remains on disk)*
- *Session 2 (fresh run):* memory loaded from disk -> "What is my name and how do I like explanations?" -> **"Aapka naam Deepak hai aur aapko Hinglish explanations pasand hain."**

**Key takeaways:**
- The model stays **stateless** — it "remembered" only because we loaded a saved fact from disk and injected it into the prompt.
- Short-term memory = the in-session `messages` array; long-term memory = an external store (here a JSON file; at scale, a vector DB queried semantically).
- Save (extract fact -> write) + Load (read -> inject) is the whole long-term memory loop.
