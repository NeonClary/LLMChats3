import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Download, Settings2, Search } from 'lucide-react';

export default function DevMenu({
  allModels,
  orchestratorModel,
  onOrchestratorChange,
  personaMode,
  onPersonaModeChange,
  speedPriority,
  onSpeedPriorityChange,
  onDownloadApiLog,
  onDownloadChatTxt,
  onDownloadChatMd,
  hasApiLog,
  hasChat,
}) {
  const [open, setOpen] = useState(false);
  const [orchOpen, setOrchOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (orchOpen && searchRef.current) searchRef.current.focus();
  }, [orchOpen]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setOrchOpen(false);
        setQ('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return allModels;
    return allModels.filter(row => {
      const hay = `${row.name} ${row.id} ${row.provider || ''}`.toLowerCase();
      return hay.includes(s);
    });
  }, [allModels, q]);

  const currentName = useMemo(() => {
    if (!orchestratorModel) return 'Default (backend)';
    const m = allModels.find(m => m.id === orchestratorModel);
    return m ? m.name : orchestratorModel;
  }, [orchestratorModel, allModels]);

  return (
    <div className="dev-wrap" ref={wrapRef}>
      <div className="dev-download-btns">
        <button className="btn-sm btn-outline" disabled={!hasChat} onClick={onDownloadChatTxt}>
          <Download size={14} /> .txt
        </button>
        <button className="btn-sm btn-outline" disabled={!hasChat} onClick={onDownloadChatMd}>
          <Download size={14} /> .md
        </button>
      </div>

      <div className="dev-dropdown-header">
        <button className="btn-sm btn-ghost" onClick={() => { setOpen(o => !o); setOrchOpen(false); setQ(''); }}>
          <Settings2 size={14} /> Developer <ChevronDown size={12} />
        </button>
        {open && (
          <div className="dev-panel">
            <button onClick={() => { setOrchOpen(o => !o); setQ(''); }}>
              Orchestrator model… <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
            </button>
            <div className="dev-panel-divider" />
            <div className="dev-panel-label">Response priority</div>
            <button
              disabled={!speedPriority}
              onClick={() => { onSpeedPriorityChange(false); }}
            >
              Prioritize model choice
            </button>
            <button
              disabled={speedPriority}
              onClick={() => { onSpeedPriorityChange(true); }}
            >
              Prioritize conversation speed
            </button>
            <div className="dev-panel-divider" />
            <button
              disabled={personaMode === 'structured'}
              onClick={() => { onPersonaModeChange('structured'); setOpen(false); }}
            >
              Structured persona input
            </button>
            <button
              disabled={personaMode === 'freeform'}
              onClick={() => { onPersonaModeChange('freeform'); setOpen(false); }}
            >
              Freeform persona input
            </button>
            <button disabled={!hasChat} className="dev-panel-download-item" onClick={() => { onDownloadChatTxt(); setOpen(false); }}>
              Download chat as .txt
            </button>
            <button disabled={!hasChat} className="dev-panel-download-item" onClick={() => { onDownloadChatMd(); setOpen(false); }}>
              Download chat as .md
            </button>
            <button disabled={!hasApiLog} onClick={() => { onDownloadApiLog(); setOpen(false); }}>
              Download full API history
            </button>
          </div>
        )}

        {open && orchOpen && (
          <div className="dev-sub-panel">
            <div className="dev-sub-header">
              <span className="dev-sub-title">Orchestrator</span>
              <span className="dev-sub-current">{currentName}</span>
            </div>
            <div className="dev-sub-search">
              <Search size={14} className="dev-sub-search-icon" />
              <input
                ref={searchRef}
                type="search"
                placeholder="Search models…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            <ul className="dev-sub-list">
              <li>
                <button
                  className={`dev-sub-item ${!orchestratorModel ? 'dev-sub-item-active' : ''}`}
                  onClick={() => { onOrchestratorChange(null); setOrchOpen(false); setOpen(false); setQ(''); }}
                >
                  <strong>Default (backend)</strong>
                  <span className="dev-sub-provider">Use server default</span>
                </button>
              </li>
              {filtered.map(m => (
                <li key={m.id}>
                  <button
                    className={`dev-sub-item ${orchestratorModel === m.id ? 'dev-sub-item-active' : ''}`}
                    onClick={() => { onOrchestratorChange(m.id); setOrchOpen(false); setOpen(false); setQ(''); }}
                  >
                    <strong>{m.name}</strong>
                    <span className="dev-sub-provider">{m.provider}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
