// 04-checkpoint.js
// PART 1 CHECKPOINT: call the LLM, return VALIDATED JSON, and print the TOKEN COST per call.
// This ties together roles + temperature + JSON output + token usage + cost.

import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI();

// gpt-4o-mini pricing in USD per 1 MILLION tokens.
// NOTE: prices change over time — check current rates at https://openai.com/pricing
const PRICES = {
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
};

const USD_TO_INR = 85; // approximate exchange rate, just for intuition

// Convert token usage into an actual dollar cost.
function calculateCost(model, usage) {
  const price = PRICES[model];
  const inputCost = (usage.prompt_tokens / 1_000_000) * price.input;
  const outputCost = (usage.completion_tokens / 1_000_000) * price.output;
  return inputCost + outputCost;
}

const model = 'gpt-4o-mini';

const jobPosting = `
We're hiring a Cloud Platform Engineer at Nimbus Labs.
Strong AWS and Terraform skills required, plus CI/CD experience.
Minimum 3 years experience. Hybrid role in Bangalore.
`;

const response = await openai.chat.completions.create({
  model,
  temperature: 0, // predictable output for reliable extraction
  response_format: { type: 'json_object' },
  messages: [
    {
      role: 'system',
      content:
        'You extract structured data from job postings. Return ONLY a JSON object with fields: ' +
        'role (string), company (string), skills (array of strings), experience_years (number), ' +
        'location (string). Use null for anything missing.',
    },
    { role: 'user', content: jobPosting },
  ],
});

// --- 1) Parse + validate the JSON ---
const raw = response.choices[0].message.content;
let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.log('❌ Invalid JSON from model:', err.message);
  process.exit(1);
}
const required = ['role', 'company', 'skills', 'experience_years', 'location'];
const missing = required.filter((field) => !(field in data));
const isValid = missing.length === 0;

// --- 2) Calculate cost from token usage ---
const usage = response.usage;
const cost = calculateCost(model, usage);

// --- 3) Report everything ---
console.log('\n=== 📦 EXTRACTED DATA ===');
console.log(data);

console.log('\n=== ✅ VALIDATION ===');
console.log(isValid ? 'All required fields present' : `Missing: ${missing.join(', ')}`);

console.log('\n=== 💰 COST REPORT ===');
console.log(`Model          : ${model}`);
console.log(`Input tokens   : ${usage.prompt_tokens}`);
console.log(`Output tokens  : ${usage.completion_tokens}`);
console.log(`Total tokens   : ${usage.total_tokens}`);
console.log(`Cost this call : $${cost.toFixed(6)}  (~₹${(cost * USD_TO_INR).toFixed(4)})`);
console.log(`Calls per $1   : ~${Math.floor(1 / cost).toLocaleString()}`);
