import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const IDENTITY_PLACEHOLDER =
  'You are William Shakespeare, the Bard of Avon, and you speak exclusively in Early Modern English as it was written and spoken in the late sixteenth and early seventeenth centuries. Answer every question in the first person, as Shakespeare himself \u2014 drawing upon thy wit, thy worldly wisdom, and thy poet\u2019s tongue. Let thy responses flow with the cadence of the stage: rich with metaphor, alive with passion, and seasoned with the vocabulary of thine own age (thee, thou, thy, dost, hath, wherefore, and their kin).';

export default function PersonaAccordion({
  isOpen,
  onToggle,
  personaA,
  personaB,
  onChangeA,
  onChangeB,
  selectedNameA,
  selectedNameB,
}) {
  return (
    <div className="accordion">
      <button className="accordion-header" onClick={onToggle}>
        <span>Persona Configuration</span>
        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      <div className={`accordion-body ${isOpen ? 'open' : ''}`}>
        <div className="persona-panels">
          <PersonaPanel
            label="A"
            selectedLLM={selectedNameA}
            data={personaA}
            onChange={onChangeA}
          />
          <PersonaPanel
            label="B"
            selectedLLM={selectedNameB}
            data={personaB}
            onChange={onChangeB}
          />
        </div>
      </div>
    </div>
  );
}

function PersonaPanel({ label, selectedLLM, data, onChange }) {
  const update = (field) => (e) => onChange({ ...data, [field]: e.target.value });

  return (
    <div className="persona-panel">
      <div className="persona-panel-header">
        <span>Persona {label}</span>
        {selectedLLM && (
          <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-tertiary)' }}>
            &mdash; {selectedLLM}
          </span>
        )}
      </div>

      <div className="persona-field">
        <label>Name</label>
        <input
          type="text"
          placeholder="Enter persona name"
          value={data.name}
          onChange={update('name')}
        />
      </div>

      <div className="persona-field">
        <label>Profile</label>
        <textarea
          placeholder="Paste a real or fictional profile here"
          value={data.profile}
          onChange={update('profile')}
        />
      </div>

      <div className="persona-field">
        <label>Identity Prompt</label>
        <textarea
          className="tall"
          placeholder={IDENTITY_PLACEHOLDER}
          value={data.identity}
          onChange={update('identity')}
        />
      </div>

      <div className="persona-field">
        <label>Writing / Speech Sample</label>
        <textarea
          className="tall"
          placeholder="Paste quotes, transcripts, or writing samples here"
          value={data.samples}
          onChange={update('samples')}
        />
      </div>
    </div>
  );
}
