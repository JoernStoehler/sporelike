import { useState, useReducer, useEffect, useRef } from 'react'
import './App.css'
import { mockPlanets } from './mockData'
import type { TabId } from './components/BottomNav'
import { TopBar } from './components/TopBar'
import { BottomNav } from './components/BottomNav'
import { PlanetView } from './components/PlanetView'
import { EcosystemView } from './components/EcosystemView'
import { ChallengeView } from './components/ChallengeView'
import { EvolveView } from './components/EvolveView'
import type { GameState, EraSummary, Species } from './types'
import { fetchEraProgression } from './api'
import { gameReducer } from './gameReducer'
import { newGameState } from './newGame'

const SAVE_KEY = 'sporelike:save:aegis-7';
const DRAFT_KEY = 'sporelike:draft:aegis-7';

function App() {
  const [gameState, dispatch] = useReducer(gameReducer, null, () => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) try { return JSON.parse(saved) as GameState; } catch {}
    return newGameState();
  });

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  const [viewEraIndex, setViewEraIndex] = useState(gameState.currentEraIndex)
  const [activeTab, setActiveTab] = useState<TabId>('ecosystem')
  const [showEraDropdown, setShowEraDropdown] = useState(false)
  const [advanceLoading, setAdvanceLoading] = useState(false)

  // UI state for challenge/evolve views
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [freeformOutcomes, setFreeformOutcomes] = useState<Record<string, string>>({})

  // Evolve draft — persisted to localStorage so preview survives refresh
  type EvolveDraft = { mutationText: string; preview: { species: Species; reasoning: string; variability: number } | null; accepted: boolean };
  const [evolveDraft, setEvolveDraft] = useState<EvolveDraft>(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) try { return JSON.parse(saved) as EvolveDraft; } catch {}
    return { mutationText: '', preview: null, accepted: false };
  });

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(evolveDraft));
  }, [evolveDraft]);

  const setMutationText = (text: string) => setEvolveDraft(d => ({ ...d, mutationText: text }));
  const setEvolvePreview = (preview: EvolveDraft['preview']) => setEvolveDraft(d => ({ ...d, preview }));
  const setMutationAccepted = (accepted: boolean) => setEvolveDraft(d => ({ ...d, accepted }));
  const { mutationText, preview: evolvePreview, accepted: mutationAccepted } = evolveDraft;

  // Reset evolve/challenge UI state when era changes (skip initial mount)
  const prevEraIndex = useRef(viewEraIndex);
  useEffect(() => {
    if (prevEraIndex.current === viewEraIndex) return;
    prevEraIndex.current = viewEraIndex;
    setChallengeIndex(0);
    setEvolveDraft({ mutationText: '', preview: null, accepted: false });
    setFreeformOutcomes({});
  }, [viewEraIndex]);

  const currentEra = gameState.eras[viewEraIndex]
  const previousEra = viewEraIndex > 0 ? gameState.eras[viewEraIndex - 1] : undefined
  const isReadOnly = viewEraIndex !== gameState.currentEraIndex
  const nextEra = viewEraIndex + 1 < gameState.eras.length ? gameState.eras[viewEraIndex + 1] : undefined
  const nextEraPlayerSpecies = nextEra?.species.find(s => s.id === nextEra.playerSpeciesId)

  async function handleAdvanceEra() {
    if (advanceLoading) return;
    const currentEraForAdvance = gameState.eras[gameState.currentEraIndex];
    const selectedMutation =
      gameState.selectedMutationIndex !== undefined
        ? gameState.mutationCandidates[gameState.selectedMutationIndex]
        : gameState.mutationCandidates[0];
    if (!selectedMutation) {
      alert('No mutation selected');
      return;
    }

    const challengeResults = currentEraForAdvance.challenges
      .filter(c => c.playerChoice !== undefined)
      .map(c => ({
        id: c.id,
        playerChoice: c.playerChoice,
        playerFreeformText: c.playerFreeformText,
        playerOutcome: c.playerOutcome,
      }));

    const history: EraSummary[] = gameState.eras.slice(0, gameState.currentEraIndex).map(era => ({
      eraNumber: era.number,
      eraName: era.name,
      events: era.events.map(e => e.description),
      playerSpeciesName: era.species.find(s => s.id === era.playerSpeciesId)?.name ?? '',
      playerTraits: era.species.find(s => s.id === era.playerSpeciesId)?.traits ?? [],
    }));

    setAdvanceLoading(true);
    try {
      const result = await fetchEraProgression({
        currentEra: currentEraForAdvance,
        challengeResults,
        selectedMutation,
        history,
        config: { targetNewSpecies: 2, targetExtinctions: 1, targetChallenges: 3 },
      });
      dispatch({ type: 'ADVANCE_ERA', newEra: result.newEra });
      setViewEraIndex(gameState.currentEraIndex + 1);
      setActiveTab('ecosystem');
      setEvolveDraft({ mutationText: '', preview: null, accepted: false });
    } catch (err) {
      alert(`Era advancement failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAdvanceLoading(false);
    }
  }

  return (
    <div className="app">
      <TopBar
        currentEra={currentEra}
        eras={gameState.eras}
        onEraSelect={setViewEraIndex}
        showDropdown={showEraDropdown}
        onToggleDropdown={() => setShowEraDropdown(!showEraDropdown)}
      />

      <main className="main-content" onClick={() => showEraDropdown && setShowEraDropdown(false)}>
        {activeTab === 'planet' && <PlanetView gameState={gameState} planets={mockPlanets} />}
        {activeTab === 'ecosystem' && <EcosystemView era={currentEra} previousEra={previousEra} />}
        {activeTab === 'challenges' && (
          <ChallengeView
            challenges={currentEra.challenges}
            currentEra={currentEra}
            onAllComplete={() => setActiveTab('evolve')}
            onChoiceMade={(challengeId, choice, freeformText, outcome) => {
              dispatch({ type: 'MAKE_CHALLENGE_CHOICE', challengeId, choice, freeformText, outcome });
              if (choice === 'freeform' && outcome) {
                setFreeformOutcomes(prev => ({ ...prev, [challengeId]: outcome }));
              }
            }}
            freeformOutcomes={freeformOutcomes}
            challengeIndex={challengeIndex}
            setChallengeIndex={setChallengeIndex}
            isReadOnly={isReadOnly}
          />
        )}
        {activeTab === 'evolve' && (
          <EvolveView
            era={currentEra}
            onAdvanceEra={handleAdvanceEra}
            onMutationAccepted={(species) => {
              dispatch({ type: 'ACCEPT_MUTATION', species });
              setMutationAccepted(true);
            }}
            advanceLoading={advanceLoading}
            isReadOnly={isReadOnly}
            nextEraPlayerSpecies={nextEraPlayerSpecies}
            mutationText={mutationText}
            setMutationText={setMutationText}
            evolvePreview={evolvePreview}
            setEvolvePreview={setEvolvePreview}
            mutationAccepted={mutationAccepted}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
