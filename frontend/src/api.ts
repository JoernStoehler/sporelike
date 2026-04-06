import type {
  Era,
  MutationPreviewInput,
  MutationPreviewOutput,
  EraProgressionInput,
} from './types';
import type { Challenge } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export interface FreeformChallengeRequestBody {
  challenge: Challenge;
  freeformText: string;
  era: Era;
}

export interface FreeformChallengeOutput {
  outcome: string;
  pointsAwarded: number;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const errBody = await res.json() as { error?: string };
      if (errBody.error) message = errBody.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function fetchMutationPreview(body: MutationPreviewInput): Promise<MutationPreviewOutput> {
  return postJson<MutationPreviewOutput>('/api/mutation-preview', body);
}

export async function fetchFreeformChallenge(body: FreeformChallengeRequestBody): Promise<FreeformChallengeOutput> {
  return postJson<FreeformChallengeOutput>('/api/freeform-challenge', body);
}

export async function fetchEraProgression(body: EraProgressionInput): Promise<{ newEra: Era }> {
  return postJson<{ newEra: Era }>('/api/era-progression', body);
}
