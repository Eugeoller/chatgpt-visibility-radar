
import { OPENAI_API_KEY, OPENAI_MODEL, TEMPERATURE } from './config.ts';
import { withRetry } from './helpers.ts';

// Call OpenAI API
export async function callOpenAI(prompt: string, systemPrompt: string): Promise<{ text: string; tokens: number }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: TEMPERATURE,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content;
  const tokens = data.usage.total_tokens;
  
  return { text, tokens };
}
