import { useState } from 'react';
import type { Challenge } from '../types';

interface Props {
  challenges: Challenge[];
  onAllComplete: () => void;
}

export function ChallengeView({ challenges, onAllComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [choices, setChoices] = useState<Map<string, { choice: number | 'freeform'; text?: string }>>(new Map());
  const [freeformText, setFreeformText] = useState('');

  const challenge = challenges[currentIndex];
  const chosen = choices.get(challenge?.id);
  const allDone = choices.size === challenges.length;

  function pickAction(actionIndex: number) {
    if (chosen) return;
    setChoices(new Map(choices).set(challenge.id, { choice: actionIndex }));
  }

  function submitFreeform() {
    if (chosen || !freeformText.trim()) return;
    setChoices(new Map(choices).set(challenge.id, { choice: 'freeform', text: freeformText }));
    setFreeformText('');
  }

  function next() {
    if (currentIndex < challenges.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function prev() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  if (!challenge) return null;

  return (
    <div className="view challenge-view">
      <div className="challenge-progress">
        {challenges.map((_, i) => (
          <span key={i} className={`progress-dot ${i === currentIndex ? 'current' : ''} ${choices.has(challenges[i].id) ? 'done' : ''}`} />
        ))}
      </div>

      <div className="challenge-card">
        <p className="challenge-desc">{challenge.description}</p>

        <div className="action-list">
          {challenge.actions.map((action, i) => (
            <button
              key={i}
              className={`action-btn ${chosen?.choice === i ? 'chosen' : ''} ${chosen && chosen.choice !== i ? 'dimmed' : ''}`}
              onClick={() => pickAction(i)}
              disabled={chosen != null}
            >
              <span className="action-label">{action.label}</span>
              {chosen?.choice === i && (
                <span className="action-outcome">{action.outcome}</span>
              )}
            </button>
          ))}
        </div>

        {!chosen && (
          <div className="freeform-input">
            <input
              type="text"
              placeholder="Or describe your own action..."
              value={freeformText}
              onChange={e => setFreeformText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitFreeform()}
            />
            <button className="btn btn-small" onClick={submitFreeform} disabled={!freeformText.trim()}>Go</button>
          </div>
        )}

        {chosen?.choice === 'freeform' && (
          <div className="freeform-result">
            <p className="freeform-action">You: "{chosen.text}"</p>
            <p className="action-outcome">The ecosystem responds in unexpected ways... (AI response would appear here)</p>
          </div>
        )}
      </div>

      <div className="challenge-nav">
        <button className="btn btn-small" onClick={prev} disabled={currentIndex === 0}>← Prev</button>
        <span className="challenge-counter">{currentIndex + 1} / {challenges.length}</span>
        {currentIndex < challenges.length - 1 ? (
          <button className="btn btn-small" onClick={next}>Next →</button>
        ) : allDone ? (
          <button className="btn btn-primary" onClick={onAllComplete}>Ready to Evolve →</button>
        ) : (
          <button className="btn btn-small" disabled>Complete all challenges</button>
        )}
      </div>
    </div>
  );
}
