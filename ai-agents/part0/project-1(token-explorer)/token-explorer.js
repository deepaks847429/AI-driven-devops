// token-explorer.js

import { encode, decode } from 'gpt-tokenizer';


const inputArg = process.argv.slice(2).join(' ');

const samples = inputArg
  ? [inputArg]
  : [
      'cat',
      'kubectl',
      'restarting',
      'CrashLoopBackOff',
      'Hello, world!',
      'server band ho gaya',
      'The quick brown fox jumps over the lazy dog.',
    ];

console.log('\n=== 🔤 TOKEN EXPLORER ===');
console.log('(dekho text kaise chhote tokens mein tootta hai)\n');

for (const text of samples) {
  // encode(): text  ->  token IDs (numbers ki list)
  const ids = encode(text);

  // decode([id]): har ek ID ko wapas uske text-tukde mein badlo
  const pieces = ids.map((id) => decode([id]));

  // har tukde ko [ ] ke andar dikhao taaki spaces bhi dikh jaayein
  const visual = pieces.map((p) => `[${p}]`).join('');

  console.log(`TEXT   : "${text}"`);
  console.log(`TOKENS : ${visual}`);
  console.log(`IDS    : ${ids.join(', ')}`);
  console.log(
    `COUNT  : ${ids.length} tokens  |  ${text.length} characters  |  ` +
      `${(text.length / ids.length).toFixed(1)} chars/token`
  );
  console.log('-'.repeat(60));
}

console.log('\n👉 own text try :  npm run tokens -- "your text here"\n');
