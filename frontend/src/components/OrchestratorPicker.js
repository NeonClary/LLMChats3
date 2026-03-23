import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';

export default function OrchestratorPicker({ open, onClose, models, currentModel, onSelect }) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return models;
    return models.filter(row => {
      const hay = `${row.name} ${row.id} ${row.provider || ''}`.toLowerCase();
      return hay.includes(s);
    });
  }, [models, q]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Orchestrator model" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel orchestrator-picker">
        <div className="modal-header">
          <h3>Orchestrator model</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="modal-hint">
          Choose any model from the app registry to use as the conversation orchestrator.
        </p>

        <div className="picker-search">
          <Search size={16} className="picker-search-icon" />
          <input
            type="search"
            placeholder="Search by any part of name or id…"
            value={q}
            onChange={e => setQ(e.target.value)}
            autoFocus
          />
        </div>

        <ul className="picker-list">
          <li>
            <button
              className={`picker-item ${!currentModel ? 'picker-item-active' : ''}`}
              onClick={() => onSelect(null)}
            >
              <span className="picker-item-info">
                <strong className="picker-item-name">Default (backend)</strong>
                <span className="picker-item-provider">Use server default orchestrator</span>
              </span>
            </button>
          </li>
          {filtered.map(m => (
            <li key={m.id}>
              <button
                className={`picker-item ${currentModel === m.id ? 'picker-item-active' : ''}`}
                onClick={() => onSelect(m.id)}
              >
                <span className="picker-item-info">
                  <strong className="picker-item-name">{m.name}</strong>
                  <span className="picker-item-provider">{m.provider}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
