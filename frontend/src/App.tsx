import { useState } from 'react'
import './App.css'
import { mockGameState, mockPlanets } from './mockData'
import type { TabId } from './components/BottomNav'
import { TopBar } from './components/TopBar'
import { BottomNav } from './components/BottomNav'
import { PlanetView } from './components/PlanetView'
import { EcosystemView } from './components/EcosystemView'
import { ChallengeView } from './components/ChallengeView'
import { EvolveView } from './components/EvolveView'
import type { GameState, EraSummary } from './types'
import { fetchEraProgression } from './api'

function App() {
  const [gameState, setGameState] = useState<GameState>(mockGameState)
  const [viewEraIndex, setViewEraIndex] = useState(gameState.currentEraIndex)
  const [activeTab, setActiveTab] = useState<TabId>('ecosystem')
  const [showEraDropdown, setShowEraDropdown] = useState(false)
  const [advanceLoading, setAdvanceLoading] = useState(false)

  const currentEra = gameState.eras[viewEraIndex]
  const previousEra = viewEraIndex > 0 ? gameState.eras[viewEraIndex - 1] : undefined
  const isReadOnly = viewEraIndex !== gameState.currentEraIndex
  const nextEra = viewEraIndex + 1 < gameState.eras.length ? gameState.eras[viewEraIndex + 1] : undefined
  const nextEraPlayerSpecies = nextEra?.species.find(s => s.id === nextEra.playerSpeciesId)

  async function handleAdvanceEra() {
    if (advanceLoading) return;
    const currentEra = gameState.eras[gameState.currentEraIndex];
    const selectedMutation =
      gameState.selectedMutationIndex !== undefined
        ? gameState.mutationCandidates[gameState.selectedMutationIndex]
        : gameState.mutationCandidates[0];
    if (!selectedMutation) {
      alert('No mutation selected');
      return;
    }

    const challengeResults = currentEra.challenges
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
        currentEra,
        challengeResults,
        selectedMutation,
        history,
        config: { targetNewSpecies: 2, targetExtinctions: 1, targetChallenges: 3 },
      });
      const newEras = [...gameState.eras, result.newEra];
      const newIndex = gameState.currentEraIndex + 1;
      setGameState({ ...gameState, eras: newEras, currentEraIndex: newIndex });
      setViewEraIndex(newIndex);
      setActiveTab('ecosystem');
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
        {activeTab === 'challenges' && <ChallengeView challenges={currentEra.challenges} currentEra={currentEra} onAllComplete={() => setActiveTab('evolve')} isReadOnly={isReadOnly} />}
        {activeTab === 'evolve' && <EvolveView era={currentEra} onAdvanceEra={handleAdvanceEra} advanceLoading={advanceLoading} isReadOnly={isReadOnly} nextEraPlayerSpecies={nextEraPlayerSpecies} />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
