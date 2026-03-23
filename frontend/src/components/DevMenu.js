import React, { useState } from 'react';
import { ChevronDown, Download, Settings2 } from 'lucide-react';
import OrchestratorPicker from './OrchestratorPicker';

export default function DevMenu({
  allModels,
  orchestratorModel,
  onOrchestratorChange,
  personaMode,
  onPersonaModeChange,
  onDownloadApiLog,
  onDownloadChatTxt,
  onDownloadChatMd,
  hasApiLog,
  hasChat,
}) {
  const [open, setOpen] = useState(false);
  const [orchOpen, setOrchOpen] = useState(false);

  return (
    <div className="dev-wrap">
      <div className="dev-download-btns">
        <button className="btn-sm btn-outline" disabled={!hasChat} onClick={onDownloadChatTxt}>
          <Download size={14} /> .txt
        </button>
        <button className="btn-sm btn-outline" disabled={!hasChat} onClick={onDownloadChatMd}>
          <Download size={14} /> .md
        </button>
      </div>

      <div className="dev-dropdown-header">
        <button className="btn-sm btn-ghost" onClick={() => setOpen(o => !o)}>
          <Settings2 size={14} /> Developer <ChevronDown size={12} />
        </button>
        {open && (
          <div className="dev-panel">
            <button onClick={() => { setOrchOpen(true); setOpen(false); }}>
              Orchestrator model…
            </button>
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
            <button disabled={!hasApiLog} onClick={() => { onDownloadApiLog(); setOpen(false); }}>
              Download full API history
            </button>
          </div>
        )}
      </div>

      <OrchestratorPicker
        open={orchOpen}
        onClose={() => setOrchOpen(false)}
        models={allModels}
        currentModel={orchestratorModel}
        onSelect={(id) => { onOrchestratorChange(id); setOrchOpen(false); }}
      />
    </div>
  );
}
