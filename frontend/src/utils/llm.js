const API_URL = 'https://api.openai.com/v1/chat/completions';

// NOTE: This value is baked into the JS bundle at build time by CRA.
// It WILL be visible in the browser devtools. Do not use a highly privileged key.
const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

export const hasLlmKey = !!API_KEY;

const safeParseJson = (value) => {
  try {
    return JSON.stringify(value);
  } catch (e) {
    return '"<unserializable>"';
  }
};

export async function openAiChat(messages) {
  if (!API_KEY) return null;

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json?.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    return null;
  }
}

export async function llmSummaryIfKey(facts) {
  if (!API_KEY) return null;

  const prompt =
    "You are a retail banking insights engine.\n" +
    "Summarize the customer's CURRENT financial position using ONLY the facts below.\n" +
    'Do NOT talk about the future.\n' +
    'Do NOT give advice.\n' +
    'Do NOT assume goals.\n\n' +
    'Output format:\n' +
    '- 1 short headline\n' +
    '- 3 bullet points (plain language)\n\n' +
    `FACTS (JSON): ${safeParseJson(facts)}`;

  return openAiChat([
    {
      role: 'system',
      content:
        'You are a safe, conservative banking assistant. Do not invent numbers. Use only the facts you are given.',
    },
    { role: 'user', content: prompt },
  ]);
}

export async function llmSimulation(question, facts) {
  if (!API_KEY) return null;

  const fullPrompt =
    'You are a financial scenario simulation engine.\n' +
    "Respond ONLY to the user's simulation question.\n" +
    'Base calculations strictly on the provided facts.\n' +
    'Use conservative assumptions.\n' +
    'Assume inflation at 5% unless the user specifies another rate.\n' +
    'Do NOT provide personalised financial advice. Provide illustrative options only.\n\n' +
    'Required output structure:\n' +
    '1) Heading: <short title derived from the question>\n' +
    '2) Scenario summary\n' +
    '3) Required income or corpus (show assumptions)\n' +
    '4) Gap vs current trajectory\n' +
    '5) Illustrative options to close the gap\n\n' +
    `FACTS (JSON): ${safeParseJson(facts)}\n\n` +
    `SIMULATION QUESTION: ${question}`;

  return openAiChat([
    {
      role: 'system',
      content:
        'You are a safe, conservative banking assistant. Do not invent numbers. Use only the facts you are given.',
    },
    { role: 'user', content: fullPrompt },
  ]);
}

