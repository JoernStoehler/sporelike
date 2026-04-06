// Raw fetch wrapper for the Anthropic Messages API.
// No SDK — plain fetch only.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 4096;
const ANTHROPIC_VERSION = '2023-06-01';

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
}

export interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

export interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: AnthropicTextBlock[];
  model: string;
  stop_reason: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface AnthropicErrorResponse {
  type: 'error';
  error: {
    type: string;
    message: string;
  };
}

/**
 * Call the Anthropic Messages API with a single user prompt.
 * Returns the raw text content of the first content block.
 * Throws an Error with a descriptive message on HTTP or API errors.
 */
export async function callAnthropic(apiKey: string, prompt: string): Promise<string> {
  const body: AnthropicRequest = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: prompt }],
  };

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(`Network error calling Anthropic API: ${String(err)}`);
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    throw new Error(`Anthropic API returned non-JSON response (HTTP ${response.status})`);
  }

  if (!response.ok) {
    const errBody = responseBody as AnthropicErrorResponse;
    const message = errBody?.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`Anthropic API error: ${message}`);
  }

  const data = responseBody as AnthropicResponse;
  const textBlock = data.content?.[0];
  if (!textBlock || textBlock.type !== 'text' || typeof textBlock.text !== 'string') {
    throw new Error('Anthropic API response missing text content block');
  }

  return textBlock.text;
}

/**
 * Parse JSON from the AI's response text.
 * The model is instructed to return JSON only, but may occasionally include
 * markdown code fences — strip those before parsing.
 */
export function parseJsonResponse<T>(rawText: string): T {
  // Strip optional markdown code fences: ```json ... ``` or ``` ... ```
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
