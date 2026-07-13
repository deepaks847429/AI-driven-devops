// mini-rag.js
// A minimal in-memory RAG: embeddings + cosine similarity (no vector DB).

// --- Chunk 1: Setup ---
import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI();

// --- Chunk 2: Knowledge Base (our documents / "book") ---
const knowledgeBase = [
  'Our deployment policy: deploys are only allowed on weekdays between 10am and 4pm.',
  'To restart a crashed pod, run: kubectl rollout restart deploy/<name> -n <namespace>.',
  'The on-call rotation changes every Monday at 9am. Check the #oncall Slack channel.',
  'Database backups run every night at 2am UTC, stored in S3 bucket company-db-backups.',
  'For a production incident, declare it in #incidents and assign an incident commander.',
];

// --- Chunk 3: Indexing - turn each chunk into an embedding (vector) ---
const embeddingResponse = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: knowledgeBase,
});

// Store each chunk's text together with its vector (our in-memory "vector DB").
const index = knowledgeBase.map((text, i) => ({
  text,
  vector: embeddingResponse.data[i].embedding,
}));

// --- Chunk 4: Cosine similarity - how close are two vectors? (score ~1 = similar) ---
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

// --- Chunk 5: Retrieve - find the top-k chunks most similar to the question ---
async function retrieve(question, k = 2) {
  // embed the question with the SAME model used for the chunks
  const qResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: question,
  });
  const questionVector = qResponse.data[0].embedding;

  // score every chunk by similarity to the question
  const scored = index.map((item) => ({
    text: item.text,
    score: cosineSimilarity(questionVector, item.vector),
  }));

  // highest score first, then keep the top k
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

// --- Chunk 6: Generate - answer using ONLY the retrieved chunks ---
const question = process.argv.slice(2).join(' ') || 'When am I allowed to deploy?';

// 1) Retrieve the most relevant chunks
const topChunks = await retrieve(question, 2);

console.log('\n❓ Question:', question);
console.log('\n📚 Retrieved context:');
topChunks.forEach((c) => console.log(`  (${c.score.toFixed(3)}) ${c.text}`));

// 2) Augment - build a context string from the retrieved chunks
const context = topChunks.map((c) => c.text).join('\n');

// 3) Generate - the LLM answers using only that context (grounding)
const answer = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  temperature: 0,
  messages: [
    {
      role: 'system',
      content:
        'Answer the question using ONLY the context provided. ' +
        'If the answer is not in the context, say "I don\'t know based on the runbook."',
    },
    { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` },
  ],
});

console.log('\n🤖 Answer:', answer.choices[0].message.content);
