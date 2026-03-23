import React, { useCallback, useRef, useState } from 'react';
import { Cpu, ChevronDown, ChevronRight } from 'lucide-react';

export default function LLMSelector({ providers, neonModels, selections, onSelectionsChange }) {
  const lastClickRef = useRef({ id: null, time: 0 });
  const [openGroups, setOpenGroups] = useState({});

  const toggleGroup = (key) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClick = useCallback((modelId) => {
    const now = Date.now();
    const last = lastClickRef.current;
    const isDoubleClick = last.id === modelId && (now - last.time) < 400;
    lastClickRef.current = { id: modelId, time: now };

    onSelectionsChange(prev => {
      if (isDoubleClick) {
        if (prev.length === 1 && prev[0] === modelId) {
          return [modelId, modelId];
        }
        if (prev.length === 2 && prev[0] === modelId && prev[1] === modelId) {
          return [];
        }
        return [modelId, modelId];
      }

      const idx = prev.indexOf(modelId);
      if (idx !== -1) {
        if (prev.length === 2 && prev[0] === prev[1]) {
          return [];
        }
        return prev.filter((_, i) => i !== idx);
      }

      if (prev.length < 2) {
        return [...prev, modelId];
      }
      return [prev[0], modelId];
    });
  }, [onSelectionsChange]);

  const getIndicatorClass = (modelId) => {
    const [a, b] = selections;
    if (a === modelId && b === modelId) return 'select-indicator double-selected';
    if (a === modelId) return 'select-indicator selected-a';
    if (b === modelId) return 'select-indicator selected-b';
    return 'select-indicator';
  };

  const getLabel = (modelId) => {
    const [a, b] = selections;
    if (a === modelId && b === modelId) return 'AB';
    if (a === modelId) return 'A';
    if (b === modelId) return 'B';
    return '';
  };

  const renderModel = (model) => (
    <button
      key={model.id}
      className="model-btn"
      onClick={() => handleClick(model.id)}
    >
      <div className={getIndicatorClass(model.id)}>
        {getLabel(model.id) && <span className="selection-label">{getLabel(model.id)}</span>}
      </div>
      <span className="model-name">{model.name}</span>
      {model.params && <span className="model-params">{model.params}</span>}
    </button>
  );

  const neonGroups = {};
  for (const m of (neonModels || [])) {
    const shortName = m.name.split('/').pop() || m.name;
    if (!neonGroups[shortName]) neonGroups[shortName] = [];
    for (const p of (m.personas || [])) {
      if (p.enabled === false) continue;
      neonGroups[shortName].push({
        id: `neon:${m.model_id}:${p.persona_name}`,
        name: p.persona_name,
        params: '',
      });
    }
  }

  return (
    <div className="sidebar">
      <div className="sidebar-title">
        <Cpu size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
        Select LLMs
      </div>

      {selections.length > 0 && (
        <div className="sidebar-selection-summary">
          {selections[0] && <div><strong>A:</strong> {displayName(selections[0], providers, neonModels)}</div>}
          {selections[1] && <div><strong>B:</strong> {displayName(selections[1], providers, neonModels)}</div>}
        </div>
      )}

      {Object.keys(neonGroups).length > 0 && (
        <div className="sidebar-section-label">Neon</div>
      )}

      {Object.entries(neonGroups).map(([groupName, models]) => {
        const key = `neon-${groupName}`;
        const isOpen = !!openGroups[key];
        return (
          <div key={key} className="provider-group">
            <button className="provider-accordion-header" onClick={() => toggleGroup(key)}>
              <span className="provider-accordion-title">{groupName}</span>
              <span className="provider-accordion-meta">
                <span className="provider-model-count">{models.length}</span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            </button>
            {isOpen && (
              <div className="model-list">
                {models.map(renderModel)}
              </div>
            )}
          </div>
        );
      })}

      {(providers || []).length > 0 && (
        <div className="sidebar-section-label">External Models</div>
      )}

      {(providers || []).map(provider => {
        const key = `prov-${provider.id}`;
        const isOpen = !!openGroups[key];
        return (
          <div key={key} className="provider-group">
            <button className="provider-accordion-header" onClick={() => toggleGroup(key)}>
              <span className="provider-accordion-title">{provider.name}</span>
              <span className="provider-accordion-meta">
                <span className="provider-model-count">{provider.models.length}</span>
                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            </button>
            {isOpen && (
              <div className="model-list">
                {provider.models.map(renderModel)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function displayName(modelId, providers, neonModels) {
  if (modelId.startsWith('neon:')) {
    const parts = modelId.split(':');
    return parts[2] || modelId;
  }
  for (const p of (providers || [])) {
    for (const m of p.models) {
      if (m.id === modelId) return m.name;
    }
  }
  return modelId;
}
