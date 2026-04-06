import { useState } from 'react'
import './App.css'
import { mockGameState } from './mockData'
import type { TabId } from './components/BottomNav'
import { TopBar } from './components/TopBar'
import { BottomNav } from './components/BottomNav'
import { PlanetView } from './components/PlanetView'
import { EcosystemView } from './components/EcosystemView'
import { ChallengeView } from './components/ChallengeView'
import { EvolveView } from './components/EvolveView'

function App() {
  const [gameState] = useState(mockGameState)
  const [viewEraIndex, setViewEraIndex] = useState(gameState.currentEraIndex)
  const [activeTab, setActiveTab] = useState<TabId>('ecosystem')
  const [showEraDropdown, setShowEraDropdown] = useState(false)

  const currentEra = gameState.eras[viewEraIndex]
  const previousEra = viewEraIndex > 0 ? gameState.eras[viewEraIndex - 1] : undefined

  function handleAdvanceEra() {
    alert('Era advancement would trigger AI generation here!')
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
        {activeTab === 'planet' && <PlanetView gameState={gameState} />}
        {activeTab === 'ecosystem' && <EcosystemView era={currentEra} previousEra={previousEra} />}
        {activeTab === 'challenges' && <ChallengeView challenges={currentEra.challenges} onAllComplete={() => setActiveTab('evolve')} />}
        {activeTab === 'evolve' && <EvolveView era={currentEra} onAdvanceEra={handleAdvanceEra} />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
