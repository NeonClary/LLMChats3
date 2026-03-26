import React, { useCallback, useState } from 'react';
import { Cloud, ChevronDown, ChevronRight } from 'lucide-react';

export default function LLMSelector({ providers, neonModels, selections, onSelectionsChange }) {
  const [openGroups, setOpenGroups] = useState({});

  const toggleGroup = (key) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClick = useCallback((modelId) => {
    onSelectionsChange(prev => {
      const isSelected = prev.includes(modelId);
      const isBoth = prev.length === 2 && prev[0] === modelId && prev[1] === modelId;

      if (isBoth) return [];

      if (isSelected) return [modelId, modelId];

      if (prev.length < 2) return [...prev, modelId];

      return [prev[1], modelId];
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
      <h2 className="sidebar-title">AI Models</h2>

      {selections.length > 0 && (
        <div className="sidebar-selection-summary">
          {selections[0] && <div><strong>A:</strong> {displayName(selections[0], providers, neonModels)}</div>}
          {selections[1] && <div><strong>B:</strong> {displayName(selections[1], providers, neonModels)}</div>}
        </div>
      )}

      {Object.keys(neonGroups).length > 0 && (
        <div className="sidebar-section">
          <h3 className="selector-title">
            <img src="/neon-logo.png" alt="" className="selector-title-icon" />
            Neon.ai Models
          </h3>
          {Object.entries(neonGroups).map(([groupName, models]) => {
            const key = `neon-${groupName}`;
            const isOpen = !!openGroups[key];
            return (
              <div key={key} className="provider-group neon-group">
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
        </div>
      )}

      {(providers || []).length > 0 && (
        <div className="sidebar-section">
          <h3 className="selector-title">
            <Cloud size={16} />
            Other Models
          </h3>
          {[...(providers || [])].sort((a, b) => a.name.localeCompare(b.name)).map(provider => {
            const key = `prov-${provider.id}`;
            const isOpen = !!openGroups[key];
            return (
              <div key={key} className="provider-group comp-group">
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
      )}
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
