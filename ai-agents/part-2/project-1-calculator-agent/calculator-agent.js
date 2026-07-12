// calculator-agent.js
// Project 1 - a hand-written AGENT LOOP with calculator tools.
// Goal: watch the AI chain multiple tool calls on its own to solve a word problem.

import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI();

// ---------------------------------------------------------------------------
// PART 1: THE TOOLS
// This is what we DESCRIBE to the AI so it knows which tools exist and when to
// use them. The AI reads the `description` and `parameters` to decide.
// ---------------------------------------------------------------------------
const tools = [
  {
    type: 'function',
    function: {
      name: 'add',
      description: 'Add two numbers and return their sum.',
      parameters: {
        type: 'object',
        properties: {
          a: { type: 'number', description: 'first number' },
          b: { type: 'number', description: 'second number' },
        },
        required: ['a', 'b'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'subtract',
      description: 'Subtract b from a (a - b).',
      parameters: {
        type: 'object',
        properties: {
          a: { type: 'number', description: 'number to subtract from' },
          b: { type: 'number', description: 'number to subtract' },
        },
        required: ['a', 'b'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'multiply',
      description: 'Multiply two numbers and return their product.',
      parameters: {
        type: 'object',
        properties: {
          a: { type: 'number', description: 'first number' },
          b: { type: 'number', description: 'second number' },
        },
        required: ['a', 'b'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'divide',
      description: 'Divide a by b (a / b).',
      parameters: {
        type: 'object',
        properties: {
          a: { type: 'number', description: 'numerator' },
          b: { type: 'number', description: 'denominator' },
        },
        required: ['a', 'b'],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// PART 2: THE DISPATCHER (our "hands")
// When the AI asks for a tool, THIS runs the real function and returns a result.
// Note the helpful error for divide-by-zero (good tool design).
// ---------------------------------------------------------------------------
function runTool(name, args) {
  switch (name) {
    case 'add':
      return args.a + args.b;
    case 'subtract':
      return args.a - args.b;
    case 'multiply':
      return args.a * args.b;
    case 'divide':
      if (args.b === 0) return 'Error: cannot divide by zero';
      return args.a / args.b;
    default:
      return `Error: unknown tool "${name}"`;
  }
}

// ---------------------------------------------------------------------------
// PART 3: THE AGENT LOOP
// This is the Part 0 diagram in code: ask model -> if it wants a tool, run it,
// feed the result back -> repeat -> until the model gives a final answer.
// ---------------------------------------------------------------------------
const messages = [
  {
    role: 'system',
    content:
      'You are a calculator agent. Always use the provided tools to do arithmetic, ' +
      'one step at a time. Never calculate in your head.',
  },
  {
    role: 'user',
    content: 'Add 25 and 17, then multiply the result by 3, then subtract 6.',
  },
];

const MAX_TURNS = 10; // GUARDRAIL: never loop forever

console.log('\n🧮 CALCULATOR AGENT');
console.log('Task:', messages[1].content, '\n');

for (let turn = 1; turn <= MAX_TURNS; turn++) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0, // predictable, reliable
    messages,
    tools, // <-- we hand the AI the list of tools
  });

  const aiMessage = response.choices[0].message;

  // Did the AI ask to use one or more tools?
  if (aiMessage.tool_calls) {
    messages.push(aiMessage); // remember the AI's request (required before tool results)

    for (const call of aiMessage.tool_calls) {
      const args = JSON.parse(call.function.arguments); // the AI's chosen arguments
      const result = runTool(call.function.name, args); // OUR code runs it

      console.log(`  [turn ${turn}] 🔧 ${call.function.name}(${args.a}, ${args.b}) = ${result}`);

      // Feed the result back so the AI can decide the next step.
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: String(result),
      });
    }
    // loop continues -> ask the AI again, now with the tool results
  } else {
    // No tool requested -> the AI is done. This is the stopping condition.
    console.log('\n✅ Final answer:', aiMessage.content);
    break;
  }
}
