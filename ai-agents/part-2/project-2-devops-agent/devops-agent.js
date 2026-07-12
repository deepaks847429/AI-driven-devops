// devops-agent.js
// Project 2 - a mini DevOps assistant agent.
// Demonstrates: read-only tools, a destructive action behind a HUMAN APPROVAL gate (HITL),
// audit logging, and a loop limit. The AI investigates a (simulated) cluster and diagnoses it.

import 'dotenv/config';
import OpenAI from 'openai';
import readline from 'node:readline/promises';

const openai = new OpenAI();

// ---------------------------------------------------------------------------
// SIMULATED CLUSTER (so we don't need a real Kubernetes cluster)
// ---------------------------------------------------------------------------
const CLUSTER = {
  pods: [
    { name: 'frontend-abc', status: 'Running' },
    { name: 'checkout-xyz', status: 'CrashLoopBackOff' },
    { name: 'database-123', status: 'Running' },
  ],
  logs: {
    'checkout-xyz':
      'Error: cannot connect to database at db:5432. Connection refused. ' +
      'Environment variable DB_HOST is not set.',
    'frontend-abc': 'Server started on port 3000. All healthy.',
    'database-123': 'Database ready. Accepting connections on 5432.',
  },
};

// A simple audit log - every tool call is recorded (a real guardrail).
const auditLog = [];

// ---------------------------------------------------------------------------
// TOOL IMPLEMENTATIONS (our "hands")
// ---------------------------------------------------------------------------
function listPods() {
  return CLUSTER.pods.map((p) => `${p.name}: ${p.status}`).join('\n');
}

function getPodLogs(podName) {
  return CLUSTER.logs[podName] ?? `Error: no pod named "${podName}" found.`;
}

// Human-in-the-loop approval. Only prompts in a real terminal; in a
// non-interactive run it denies by default (safe default).
async function askApproval(question) {
  if (!process.stdin.isTTY) {
    console.log('      (non-interactive shell -> auto-DENY for safety)');
    return false;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim().toLowerCase().startsWith('y');
}

// ---------------------------------------------------------------------------
// THE DISPATCHER + GUARDRAILS
// Read-only tools run freely. The destructive tool must pass an approval gate.
// ---------------------------------------------------------------------------
async function runTool(name, args) {
  auditLog.push({ tool: name, args }); // AUDIT: record every call

  switch (name) {
    case 'list_pods':
      return listPods();

    case 'get_pod_logs':
      return getPodLogs(args.pod_name);

    case 'restart_pod': {
      // GUARDRAIL: destructive action -> require human approval before running.
      const approved = await askApproval(
        `      ⚠️  Agent wants to RESTART pod "${args.pod_name}". Approve? (y/n): `
      );
      if (!approved) {
        return `DENIED by human. Pod "${args.pod_name}" was NOT restarted.`;
      }
      return `Pod "${args.pod_name}" was restarted successfully.`;
    }

    default:
      return `Error: unknown tool "${name}"`;
  }
}

// ---------------------------------------------------------------------------
// TOOL DEFINITIONS (what we describe to the AI)
// ---------------------------------------------------------------------------
const tools = [
  {
    type: 'function',
    function: {
      name: 'list_pods',
      description: 'List all pods in the cluster with their current status. Read-only.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_pod_logs',
      description: 'Get the recent logs for a specific pod. Read-only.',
      parameters: {
        type: 'object',
        properties: {
          pod_name: { type: 'string', description: 'the exact pod name' },
        },
        required: ['pod_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'restart_pod',
      description: 'Restart a pod. DESTRUCTIVE - requires human approval before it runs.',
      parameters: {
        type: 'object',
        properties: {
          pod_name: { type: 'string', description: 'the exact pod name to restart' },
        },
        required: ['pod_name'],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// THE AGENT LOOP
// ---------------------------------------------------------------------------
const messages = [
  {
    role: 'system',
    content:
      'You are a DevOps SRE assistant. Investigate the cluster to find what is broken. ' +
      'Use list_pods to see status and get_pod_logs to read logs. Diagnose the ROOT CAUSE. ' +
      'After diagnosing, if restarting the failing pod could help, attempt it with restart_pod ' +
      '(this needs human approval). Finish with a short, clear report of the problem and the fix.',
  },
  {
    role: 'user',
    content: 'Something is wrong in the cluster. Investigate and tell me what is broken and how to fix it.',
  },
];

const MAX_TURNS = 10; // GUARDRAIL: never loop forever

console.log('\n🔧 DEVOPS ASSISTANT AGENT');
console.log('Task:', messages[1].content, '\n');

for (let turn = 1; turn <= MAX_TURNS; turn++) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages,
    tools,
  });

  const aiMessage = response.choices[0].message;

  if (aiMessage.tool_calls) {
    messages.push(aiMessage); // remember the AI's request first

    for (const call of aiMessage.tool_calls) {
      const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
      console.log(`  [turn ${turn}] 🔧 ${call.function.name}(${JSON.stringify(args)})`);

      const result = await runTool(call.function.name, args);
      console.log(`             -> ${result.replace(/\n/g, ' | ')}`);

      messages.push({ role: 'tool', tool_call_id: call.id, content: String(result) });
    }
  } else {
    console.log('\n✅ AGENT REPORT:\n' + aiMessage.content);
    break;
  }
}

// Show the audit trail at the end (traceability).
console.log('\n--- 📜 AUDIT LOG (every tool call) ---');
auditLog.forEach((entry, i) => console.log(`${i + 1}. ${entry.tool} ${JSON.stringify(entry.args)}`));
