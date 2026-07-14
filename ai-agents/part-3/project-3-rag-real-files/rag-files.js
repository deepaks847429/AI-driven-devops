// rag-files.js
// RAG over REAL files with proper chunking (upgrade of the mini-RAG).

// --- Chunk 1: Setup + imports ---
import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'node:fs'; // read files from disk
import path from 'node:path'; // build correct file paths

const openai = new OpenAI();

// --- Chunk 2: Read all files from the docs/ folder ---
const DOCS_DIR = './docs';
const files = fs.readdirSync(DOCS_DIR); // list of file names in the folder

const documents = files.map((filename) => ({
  filename,
  text: fs.readFileSync(path.join(DOCS_DIR, filename), 'utf-8'), // the file's content
}));

// --- Chunk 3: Split a big text into overlapping word chunks ---
function chunkText(text, chunkSize = 40, overlap = 10) {
  const words = text.split(/\s+/).filter(Boolean); // break into words
  const chunks = [];
  let start = 0;
  while (start < words.length) {
    const chunk = words.slice(start, start + chunkSize).join(' '); // take chunkSize words
    chunks.push(chunk);
    start += chunkSize - overlap; // move forward, keeping some overlap
  }
  return chunks;
}

// --- Chunk 4: Chunk every document, then embed all chunks ---
const allChunks = [];
for (const doc of documents) {
  const pieces = chunkText(doc.text);
  for (const piece of pieces) {
    allChunks.push({ filename: doc.filename, text: piece }); // keep the source filename
  }
}

const embeddingResponse = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: allChunks.map((c) => c.text), // embed just the text of every chunk
});

const index = allChunks.map((chunk, i) => ({
  filename: chunk.filename,
  text: chunk.text,
  vector: embeddingResponse.data[i].embedding,
}));

// --- Chunk 5: Cosine similarity + retrieve top-k chunks ---
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

async function retrieve(question, k = 3) {
  const qResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: question,
  });
  const questionVector = qResponse.data[0].embedding;

  const scored = index.map((item) => ({
    filename: item.filename,
    text: item.text,
    score: cosineSimilarity(questionVector, item.vector),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

// --- Chunk 6: Generate an answer + show sources (citations) ---
const question = process.argv.slice(2).join(' ') || 'When can I deploy and what happens on Fridays?';

const topChunks = await retrieve(question, 3);

console.log('\n❓ Question:', question);
console.log(`\n📚 Retrieved ${topChunks.length} chunks (from ${index.length} total):`);
topChunks.forEach((c) => console.log(`  (${c.score.toFixed(3)}) [${c.filename}] ${c.text.slice(0, 70)}...`));

// Build context, tagging each chunk with its source filename so the model can cite it
const context = topChunks.map((c) => `[${c.filename}] ${c.text}`).join('\n\n');

const answer = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  temperature: 0,
  messages: [
    {
      role: 'system',
      content:
        'Answer the question using ONLY the context provided. ' +
        'If the answer is not in the context, say you do not know. ' +
        'Cite the source filename(s) you used in square brackets.',
    },
    { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` },
  ],
});

console.log('\n🤖 Answer:', answer.choices[0].message.content);

// Unique source files that fed the answer
const sources = [...new Set(topChunks.map((c) => c.filename))];
console.log('\n📎 Sources:', sources.join(', '));
