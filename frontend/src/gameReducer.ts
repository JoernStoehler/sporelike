import type { GameState, Species, Era } from './types';

export type GameAction =
  | { type: 'MAKE_CHALLENGE_CHOICE'; challengeId: string; choice: number | 'freeform'; freeformText?: string; outcome?: string }
  | { type: 'ACCEPT_MUTATION'; species: Species }
  | { type: 'ADVANCE_ERA'; newEra: Era }
  | { type: 'LOAD_SAVE'; state: GameState };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MAKE_CHALLENGE_CHOICE': {
      const eras = [...state.eras];
      const era = { ...eras[state.currentEraIndex] };
      era.challenges = era.challenges.map(c =>
        c.id === action.challengeId
          ? { ...c, playerChoice: action.choice, playerFreeformText: action.freeformText, playerOutcome: action.outcome }
          : c
      );
      eras[state.currentEraIndex] = era;
      return { ...state, eras };
    }

    case 'ACCEPT_MUTATION':
      return {
        ...state,
        mutationCandidates: [action.species],
        selectedMutationIndex: 0,
      };

    case 'ADVANCE_ERA': {
      const newEras = [...state.eras, action.newEra];
      return {
        ...state,
        eras: newEras,
        currentEraIndex: state.currentEraIndex + 1,
        mutationCandidates: [],
        selectedMutationIndex: undefined,
      };
    }

    case 'LOAD_SAVE':
      return action.state;
  }
}
