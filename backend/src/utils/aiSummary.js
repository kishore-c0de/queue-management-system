// src/utils/aiSummary.js
//
// This is the ENTIRE "AI" part of the project — a single REST call to
// an LLM's chat-completions endpoint. No ML libraries, no training,
// no local models. We send it JSON stats and ask for 2-3 sentences
// of text back.
//
// Works with Groq (free tier, OpenAI-compatible API) or OpenAI itself —
// just swap AI_API_URL / AI_MODEL / AI_API_KEY in .env.

async function generateSummary(stats) {
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
  const model = process.env.AI_MODEL || 'llama-3.1-8b-instant';

  if (!apiKey) {
    throw new Error('AI_API_KEY is not set in .env — get a free key from console.groq.com');
  }

  const prompt = `Summarize this business's queue performance for the day in 2-3 sentences and suggest one improvement:\n${JSON.stringify(stats, null, 2)}`;

  // Node 18+ has fetch built in globally — no need to install node-fetch.
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

module.exports = { generateSummary };
