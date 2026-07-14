// rag-tool-agent.js
// Project 4 - RAG exposed as a TOOL inside an agent loop (Part 2 + Part 3).
// The agent decides WHEN to search the knowledge base.

// =====================================================================
// REUSED from earlier projects (you have built all of this before):
//   setup -> knowledge base -> embed (index) -> cosine similarity -> retrieve
// =====================================================================
import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI();

// A small hardcoded knowledge base (chunks), like the mini-RAG.
const knowledgeBase = [
  'Deploys are only allowed on weekdays between 10am and 4pm. Deploys are frozen on Fridays after 2pm.',
  'To roll back a bad release, run: kubectl rollout undo deploy/<name> -n <namespace>.',
  'The on-call rotation changes every Monday at 9am. The current on-call engineer is in the #oncall Slack channel.',
  'If the primary on-call does not acknowledge a critical alert within 15 minutes, it escalates to the secondary on-call.',
  'For a production incident, declare it in #incidents and assign an incident commander. SEV1 means a full outage.',
];

// Index: embed every chunk once at startup.
const embeddingResponse = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: knowledgeBase,
});
const index = knowledgeBase.map((text, i) => ({
  text,
  vector: embeddingResponse.data[i].embedding,
}));

// Cosine similarity (same as before).
function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Retrieve top-k chunks for a query (same as before).
async function retrieve(query, k = 2) {
  const qResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  const queryVector = qResponse.data[0].embedding;
  const scored = index.map((item) => ({
    text: item.text,
    score: cosineSimilarity(queryVector, item.vector),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

// =====================================================================
// NEW Part 1: expose RAG as a TOOL the agent can call
// =====================================================================
const tools = [
  {
    type: 'function',
    function: {
      name: 'search_knowledge_base',
      description:
        'Search the company knowledge base (runbooks) for relevant information. ' +
        'Use this whenever the user asks about deploys, on-call, incidents, or company policy.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'what to search for' },
        },
        required: ['query'],
      },
    },
  },
];

// Dispatcher: when the AI calls the tool, run RAG retrieve() and return the chunks.
async function runTool(name, args) {
  if (name === 'search_knowledge_base') {
    const chunks = await retrieve(args.query, 2);
    return chunks.map((c) => c.text).join('\n');
  }
  return `Error: unknown tool "${name}"`;
}

// =====================================================================
// NEW Part 2: the agent loop - the AI decides WHEN to search
// =====================================================================
const userMessage = process.argv.slice(2).join(' ') || 'What is our deploy policy?';

const messages = [
  {
    role: 'system',
    content:
      'You are a helpful DevOps assistant. Use the search_knowledge_base tool ' +
      'when the user asks about company policy, deploys, on-call, or incidents. ' +
      'For casual chat, just reply normally without searching.',
  },
  { role: 'user', content: userMessage },
];

const MAX_TURNS = 5; // guardrail

console.log('\n👤 User:', userMessage);

for (let turn = 1; turn <= MAX_TURNS; turn++) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages,
    tools,
  });

  const aiMessage = response.choices[0].message;

  if (aiMessage.tool_calls) {
    // Tareeka 2: the AI asked to search
    messages.push(aiMessage);
    for (const call of aiMessage.tool_calls) {
      const args = JSON.parse(call.function.arguments);
      console.log(`  🔧 [searched knowledge base] "${args.query}"`);
      const result = await runTool(call.function.name, args);
      messages.push({ role: 'tool', tool_call_id: call.id, content: result });
    }
  } else {
    // Tareeka 1: the AI gave a final answer
    console.log('\n🤖 AI:', aiMessage.content);
    break;
  }
}
