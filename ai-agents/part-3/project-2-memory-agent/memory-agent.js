// memory-agent.js
// Demonstrates LONG-TERM memory: facts are saved to disk (memory.json) and
// loaded back on the next run, so the agent "remembers" across sessions.
// Run it twice with different messages to see it remember.

import 'dotenv/config';
import OpenAI from 'openai';
import fs from 'node:fs'; // Node's file system - lets us read/write disk

const openai = new OpenAI();
const MEMORY_FILE = './memory.json'; // our persistent store (survives program exit)

// Load long-term memory from disk (returns [] if the file doesn't exist yet).
function loadMemory() {
  if (fs.existsSync(MEMORY_FILE)) {
    return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
  }
  return [];
}

// Save the memory array back to disk as JSON.
function saveMemory(memory) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
}

// The user's message for this run (from the terminal).
const userMessage = process.argv.slice(2).join(' ') || 'What is my name and what do I prefer?';

// --- Step 1: LOAD what we remembered from previous runs ---
const memory = loadMemory();
console.log('🧠 Long-term memory loaded:', memory.length ? memory : '(empty)');

// --- Step 2: INJECT the remembered facts into the prompt, then answer ---
const memoryText = memory.length ? memory.map((m) => `- ${m}`).join('\n') : 'Nothing yet.';
const chat = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  temperature: 0,
  messages: [
    {
      role: 'system',
      content: `You are a helpful assistant with memory.\nKnown facts about the user:\n${memoryText}\nUse them when relevant.`,
    },
    { role: 'user', content: userMessage },
  ],
});
console.log('\n👤 User:', userMessage);
console.log('🤖 AI  :', chat.choices[0].message.content);

// --- Step 3: EXTRACT any new durable fact and SAVE it to disk ---
const extraction = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  temperature: 0,
  response_format: { type: 'json_object' },
  messages: [
    {
      role: 'system',
      content:
        'Extract one durable fact about the user worth remembering long-term ' +
        '(name, preference, role, goal). Reply as JSON: {"fact": "..."} ' +
        'or {"fact": null} if there is nothing worth saving.',
    },
    { role: 'user', content: userMessage },
  ],
});
const { fact } = JSON.parse(extraction.choices[0].message.content);
if (fact) {
  memory.push(fact);
  saveMemory(memory);
  console.log('\n💾 Saved new fact to long-term memory:', fact);
} else {
  console.log('\n(no new fact to save)');
}
