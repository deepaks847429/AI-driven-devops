// 03-structured-json.js
// Extract structured JSON data from a messy job-posting text.
// This is the feature that turns an LLM from a "chatbot" into an automation tool.

import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI();

// A messy, human-written job posting — the kind of unstructured text our agent will face.
const jobPosting = `
We're hiring a Senior DevOps Engineer at Acme Corp!
You must know Kubernetes and Terraform, and ideally AWS.
Looking for 5+ years of experience. This is a fully remote role.
`;

// Ask the AI to EXTRACT specific fields as JSON.
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  temperature: 0, // 0 = consistent, reliable output (important for automation)
  response_format: { type: 'json_object' }, // force the reply to be valid JSON
  messages: [
    {
      role: 'system',
      content:
        'You extract structured data from job postings. ' +
        'Return ONLY a JSON object with these fields: ' +
        'role (string), company (string), skills (array of strings), ' +
        'experience_years (number), location (string). ' +
        'If a field is missing, use null.',
    },
    { role: 'user', content: jobPosting },
  ],
});

// Step 1: get the raw reply. It should be JSON, but it is still just TEXT for now.
const raw = response.choices[0].message.content;
console.log('\n--- Raw AI output (still just text) ---');
console.log(raw);

// Step 2: PARSE the text into a real JavaScript object we can use.
//         Wrapped in try/catch because we should never blindly trust model output.
let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.log('\n❌ AI did not return valid JSON:', err.message);
  process.exit(1);
}

// Step 3: VALIDATE — make sure every field we need is actually present.
const requiredFields = ['role', 'company', 'skills', 'experience_years', 'location'];
const missing = requiredFields.filter((field) => !(field in data));
if (missing.length > 0) {
  console.log('\n⚠️  Validation failed. Missing fields:', missing);
} else {
  console.log('\n✅ Validation passed. All required fields present.');
}

// Step 4: now the data is USABLE by code — this is real automation.
console.log('\n--- Now our code can USE the data directly ---');
console.log('Role             :', data.role);
console.log('Company          :', data.company);
console.log('Skills           :', data.skills);
console.log('Knows Kubernetes :', data.skills.includes('Kubernetes'));
console.log('Enough exp (>3)  :', data.experience_years > 3);
console.log('Location         :', data.location);
