// Raw fetch wrapper for the Gemini API.
// No SDK — plain fetch only.

const MODEL = 'gemini-2.0-flash';

interface GeminiRequest {
  contents: { parts: { text: string }[] }[];
}

interface GeminiResponse {
  candidates?: { content: { parts: { text: string }[] } }[];
  error?: { message: string; code: number };
}

/**
 * Call the Gemini generateContent API with a single user prompt.
 * Returns the raw text from the first candidate.
 */
export async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const body: GeminiRequest = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(`Network error calling Gemini API: ${String(err)}`);
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    throw new Error(`Gemini API returned non-JSON response (HTTP ${response.status})`);
  }

  if (!response.ok) {
    const errBody = responseBody as GeminiResponse;
    const message = errBody?.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`Gemini API error: ${message}`);
  }

  const data = responseBody as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') {
    throw new Error('Gemini API response missing text content');
  }

  return text;
}

/**
 * Parse JSON from the AI's response text.
 * Strip optional markdown code fences before parsing.
 */
export function parseJsonResponse<T>(rawText: string): T {
  const stripped = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    throw new Error(`Failed to parse JSON from AI response. Raw text: ${rawText.slice(0, 200)}`);
  }

  return parsed as T;
}
