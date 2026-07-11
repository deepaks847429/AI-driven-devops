// 01-first-call.js
// Part 1 — hamari PEHLI baat asli AI se. 🎉
// Ye script AI ko ek message bhejti hai (roles ke saath) aur jawab print karti hai.

// 1) .env file load karo — isse OPENAI_API_KEY process.env mein aa jaati hai.
//    (Ye line sabse upar honi chahiye, kisi bhi key use se pehle.)
import 'dotenv/config';

// 2) OpenAI ki library import karo.
import OpenAI from 'openai';

// 3) Client banao. Ye automatically OPENAI_API_KEY .env se utha leta hai.
const openai = new OpenAI();

// 4) Ye hai hamari conversation — ROLES ke saath (Part 1 ka core concept).
const messages = [
  {
    role: 'system', // AI ka "character" set karo
    content: 'Tum ek friendly DevOps tutor ho. Hamesha simple Hindi/Hinglish mein, chhote jawab do.',
  },
  {
    role: 'user', // asli sawaal
    content: 'Ek line mein batao: Kubernetes pod kya hota hai?',
  },
];

console.log('\n⏳ AI se baat kar rahe hain...\n');

// 5) API call — yahan actual request jaati hai OpenAI ke server ko.
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini', // ek sasta + tez model (seekhne ke liye perfect)
  messages: messages,
});

// 6) AI ka jawab nikaalo aur print karo.
const reply = response.choices[0].message.content;
console.log('🤖 AI:', reply);

// 7) Tokens ka hisaab (Part 0 se connection!) — kitne token lage.
const usage = response.usage;
console.log('\n--- 📊 Token usage ---');
console.log('Input (prompt) tokens :', usage.prompt_tokens);
console.log('Output (reply) tokens :', usage.completion_tokens);
console.log('Total tokens          :', usage.total_tokens);
