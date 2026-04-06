export type TabId = 'planet' | 'ecosystem' | 'challenges' | 'evolve';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; icon: string; label: string }[] = [
  { id: 'planet', icon: '🪐', label: 'Planet' },
  { id: 'ecosystem', icon: '🌿', label: 'Ecosystem' },
  { id: 'challenges', icon: '⚔️', label: 'Challenges' },
  { id: 'evolve', icon: '🧬', label: 'Evolve' },
];

export function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
