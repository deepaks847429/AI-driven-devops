// 02-knobs.js
// Experiment: see how `temperature` and `max_tokens` change the AI's behaviour.

import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI();

// Helper: send one prompt with the given settings and return the reply text.
async function ask(prompt, { temperature, max_tokens }) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature, // creativity/randomness knob (0 = predictable, high = creative)
    max_tokens, // hard cap on how many tokens the reply can use
    messages: [
      { role: 'system', content: 'You are a creative assistant. Reply with just the answer, no extra text.' },
      { role: 'user', content: prompt },
    ],
  });
  return response.choices[0].message.content.trim();
}

const prompt = 'Suggest ONE creative product name for a new DevOps monitoring tool.';

// EXPERIMENT 1: temperature = 0 -> predictable. Same question twice = almost identical answers.
console.log('\n=== EXPERIMENT 1: temperature = 0 (predictable) ===');
console.log('Run 1:', await ask(prompt, { temperature: 0, max_tokens: 30 }));
console.log('Run 2:', await ask(prompt, { temperature: 0, max_tokens: 30 }));
console.log('--> Both should be (almost) the SAME.');

// EXPERIMENT 2: temperature = 1.7 -> creative/random. Same question twice = different answers.
console.log('\n=== EXPERIMENT 2: temperature = 1.7 (creative/random) ===');
console.log('Run 1:', await ask(prompt, { temperature: 1.7, max_tokens: 30 }));
console.log('Run 2:', await ask(prompt, { temperature: 1.7, max_tokens: 30 }));
console.log('--> Both should be DIFFERENT.');

// EXPERIMENT 3: max_tokens = 15 -> the reply gets cut off mid-sentence.
console.log('\n=== EXPERIMENT 3: max_tokens = 15 (short cap) ===');
const capped = await ask('Explain in detail what Kubernetes is.', { temperature: 0.5, max_tokens: 15 });
console.log('Capped reply:', capped);
console.log('--> Answer is CUT OFF because max_tokens is small.');
