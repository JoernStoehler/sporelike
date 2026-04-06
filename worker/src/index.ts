import { callGemini, parseJsonResponse } from './gemini';
import {
  buildMutationPrompt,
  buildEraProgressionPrompt,
  buildFreeformChallengePrompt,
} from './prompts';
import type {
  MutationPreviewRequestBody,
  MutationPreviewOutput,
  EraProgressionRequestBody,
  Era,
  FreeformChallengeRequestBody,
  FreeformChallengeOutput,
} from './types';

// ---- Environment bindings ----

interface Env {
  GEMINI_API_KEY: string;
}

// ---- CORS helpers ----

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function corsHeaders(): HeadersInit {
  return CORS_HEADERS;
}

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: corsHeaders(),
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

// ---- Request validation helpers ----

/**
 * Parse request body as JSON, returning an error Response if the
 * Content-Type is wrong or the body isn't valid JSON.
 */
async function parseJsonBody(request: Request): Promise<{ data: unknown; error: Response | null }> {
  const ct = request.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    return {
      data: null,
      error: errorResponse('Content-Type must be application/json', 415),
    };
  }
  try {
    const data = await request.json();
    return { data, error: null };
  } catch {
    return { data: null, error: errorResponse('Request body is not valid JSON', 400) };
  }
}

function hasFields(obj: unknown, fields: string[]): obj is Record<string, unknown> {
  if (typeof obj !== 'object' || obj === null) return false;
  for (const field of fields) {
    if (!(field in obj)) return false;
  }
  return true;
}

// ---- Route handlers ----

async function handleMutationPreview(request: Request, env: Env): Promise<Response> {
  const { data, error } = await parseJsonBody(request);
  if (error) return error;

  if (!hasFields(data, ['currentEra', 'playerSpecies', 'requestedChange'])) {
    return errorResponse('Missing required fields: currentEra, playerSpecies, requestedChange');
  }

  const body = data as unknown as MutationPreviewRequestBody;

  if (typeof body.requestedChange !== 'string' || body.requestedChange.trim() === '') {
    return errorResponse('requestedChange must be a non-empty string');
  }

  let rawText: string;
  try {
    const prompt = buildMutationPrompt({
      currentEra: body.currentEra,
      playerSpecies: body.playerSpecies,
      requestedChange: body.requestedChange,
    });
    rawText = await callGemini(env.GEMINI_API_KEY, prompt);
  } catch (err) {
    return errorResponse(`AI call failed: ${String(err)}`, 502);
  }

  let result: MutationPreviewOutput;
  try {
    result = parseJsonResponse<MutationPreviewOutput>(rawText);
  } catch (err) {
    return errorResponse(`Failed to parse AI response: ${String(err)}`, 502);
  }

  return jsonResponse(result);
}

async function handleEraProgression(request: Request, env: Env): Promise<Response> {
  const { data, error } = await parseJsonBody(request);
  if (error) return error;

  if (
    !hasFields(data, [
      'currentEra',
      'challengeResults',
      'selectedMutation',
      'history',
      'config',
    ])
  ) {
    return errorResponse(
      'Missing required fields: currentEra, challengeResults, selectedMutation, history, config'
    );
  }

  const body = data as unknown as EraProgressionRequestBody;

  let rawText: string;
  try {
    const prompt = buildEraProgressionPrompt(body);
    rawText = await callGemini(env.GEMINI_API_KEY, prompt);
  } catch (err) {
    return errorResponse(`AI call failed: ${String(err)}`, 502);
  }

  let result: { newEra: Era };
  try {
    result = parseJsonResponse<{ newEra: Era }>(rawText);
  } catch (err) {
    return errorResponse(`Failed to parse AI response: ${String(err)}`, 502);
  }

  return jsonResponse(result);
}

async function handleFreeformChallenge(request: Request, env: Env): Promise<Response> {
  const { data, error } = await parseJsonBody(request);
  if (error) return error;

  if (!hasFields(data, ['challenge', 'freeformText', 'era'])) {
    return errorResponse('Missing required fields: challenge, freeformText, era');
  }

  const body = data as unknown as FreeformChallengeRequestBody;

  if (typeof body.freeformText !== 'string' || body.freeformText.trim() === '') {
    return errorResponse('freeformText must be a non-empty string');
  }

  let rawText: string;
  try {
    const prompt = buildFreeformChallengePrompt(body.challenge, body.freeformText, body.era);
    rawText = await callGemini(env.GEMINI_API_KEY, prompt);
  } catch (err) {
    return errorResponse(`AI call failed: ${String(err)}`, 502);
  }

  let result: FreeformChallengeOutput;
  try {
    result = parseJsonResponse<FreeformChallengeOutput>(rawText);
  } catch (err) {
    return errorResponse(`Failed to parse AI response: ${String(err)}`, 502);
  }

  return jsonResponse(result);
}

// ---- Main fetch handler ----

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;
    const start = Date.now();

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Health check
    if (pathname === '/api/health' && method === 'GET') {
      return jsonResponse({ status: 'ok' });
    }

    let response: Response;

    // Route POST endpoints
    if (method === 'POST') {
      switch (pathname) {
        case '/api/mutation-preview':
          response = await handleMutationPreview(request, env);
          break;

        case '/api/era-progression':
          response = await handleEraProgression(request, env);
          break;

        case '/api/freeform-challenge':
          response = await handleFreeformChallenge(request, env);
          break;

        default:
          response = errorResponse(`Unknown endpoint: ${pathname}`, 404);
      }
    } else {
      response = errorResponse(`Method ${method} not allowed`, 405);
    }

    console.log(JSON.stringify({
      method, pathname, status: response.status, ms: Date.now() - start,
    }));

    return response;
  },
} satisfies ExportedHandler<Env>;
