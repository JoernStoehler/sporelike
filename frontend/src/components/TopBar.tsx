import type { Era } from '../types';

interface Props {
  currentEra: Era;
  eras: Era[];
  onEraSelect: (index: number) => void;
  showDropdown: boolean;
  onToggleDropdown: () => void;
}

export function TopBar({ currentEra, eras, onEraSelect, showDropdown, onToggleDropdown }: Props) {
  return (
    <div className="top-bar">
      <button className="top-bar-button" onClick={onToggleDropdown}>
        <span className="era-label">Era {currentEra.number}</span>
        <span className="era-name">{currentEra.name}</span>
        <span className="dropdown-arrow">{showDropdown ? '▲' : '▼'}</span>
      </button>
      {showDropdown && (
        <div className="era-dropdown">
          {eras.map((era, i) => (
            <button
              key={era.number}
              className={`era-dropdown-item ${era.number === currentEra.number ? 'active' : ''}`}
              onClick={() => { onEraSelect(i); onToggleDropdown(); }}
            >
              <span>Era {era.number}</span>
              <span className="era-dropdown-name">{era.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
