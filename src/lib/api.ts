// src/lib/api.ts

/**
 * This function sends your conversation to the Grok API through /api/grok, 
 * handles errors safely, extracts the model’s reply, 
 * and returns it in a clean and usable format.
 * 
 */
export type Message = { role: 'system' | 'user' | 'assistant'; content: string };


export async function requestGrokCompletion(messages: Message[], model = 'grok-4') {
  const resp = await fetch('/api/grok', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Request failed ${resp.status}`);
  }
  const data = await resp.json();
  // xAI responses typically carry something like data.choices[0].message.content
  const content = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? '';
  return { raw: data, text: content };
}
