import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import LLMSelector from './components/LLMSelector';
import PersonaAccordion from './components/PersonaAccordion';
import ChatControls from './components/ChatControls';
import ChatArea from './components/ChatArea';
import ExportBar from './components/ExportBar';
import { fetchModels, generateRole, startChat } from './utils/api';
import './styles/variables.css';
import './styles/layout.css';
import './styles/components.css';

const EMPTY_PERSONA = { name: '', profile: '', identity: '', samples: '' };

function getDisplayName(modelId, providers, neonModels) {
  if (!modelId) return '';
  if (modelId.startsWith('neon:')) {
    return modelId.split(':')[2] || modelId;
  }
  for (const p of (providers || [])) {
    for (const m of p.models) {
      if (m.id === modelId) return m.name;
    }
  }
  return modelId;
}

export default function App() {
  const [theme, setTheme] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const [providers, setProviders] = useState([]);
  const [neonModels, setNeonModels] = useState([]);
  const [selections, setSelections] = useState([]);
  const [personaA, setPersonaA] = useState({ ...EMPTY_PERSONA });
  const [personaB, setPersonaB] = useState({ ...EMPTY_PERSONA });
  const [accordionOpen, setAccordionOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [systemMessages, setSystemMessages] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [chatFinished, setChatFinished] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchModels()
      .then(data => {
        setProviders(data.providers || []);
        setNeonModels(data.neon_models || []);
      })
      .catch(err => console.error('Failed to load models:', err));
  }, []);

  const selectedNameA = selections[0] ? getDisplayName(selections[0], providers, neonModels) : '';
  const selectedNameB = selections[1] ? getDisplayName(selections[1], providers, neonModels) : '';

  const canStart = selections.length === 2 && !isRunning && !chatFinished;

  const handleStop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsRunning(false);
    setChatFinished(true);
    setStatusText('');
    setSystemMessages(prev => [...prev, { text: 'Chat stopped by user.' }]);
  }, []);

  const handleStart = useCallback(async (starterText) => {
    if (selections.length < 2) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setIsRunning(true);
    setAccordionOpen(false);
    setMessages([]);
    setSystemMessages([]);
    setChatFinished(false);
    setStatusText('Generating persona roles...');

    try {
      const [roleA, roleB] = await Promise.all([
        generateRole({
          model_id: selections[0],
          name: personaA.name,
          profile: personaA.profile,
          identity: personaA.identity,
          samples: personaA.samples,
        }),
        generateRole({
          model_id: selections[1],
          name: personaB.name,
          profile: personaB.profile,
          identity: personaB.identity,
          samples: personaB.samples,
        }),
      ]);

      if (controller.signal.aborted) return;

      setStatusText('Starting conversation...');

      await startChat(
        {
          persona_a_model_id: selections[0],
          persona_a_name: personaA.name || 'Persona A',
          persona_a_role: roleA.role_prompt,
          persona_b_model_id: selections[1],
          persona_b_name: personaB.name || 'Persona B',
          persona_b_role: roleB.role_prompt,
          starter_text: starterText,
        },
        {
          onSession: (data) => setSessionId(data.session_id),
          onMessage: (data) => {
            setMessages(prev => [...prev, data]);
            setStatusText('Conversation in progress...');
          },
          onSystem: (data) => {
            setSystemMessages(prev => [...prev, data]);
            if (data.text === 'End of Chat') {
              setChatFinished(true);
              setStatusText('');
            }
          },
          onStatus: (data) => setStatusText(data.message || ''),
          onError: (data) => {
            setStatusText('');
            setSystemMessages(prev => [...prev, { text: `Error: ${data.message}` }]);
          },
          onDone: () => {
            setIsRunning(false);
            setStatusText('');
          },
        },
        controller.signal,
      );
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Chat error:', err);
      setSystemMessages(prev => [...prev, { text: `Error: ${err.message}` }]);
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [selections, personaA, personaB]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="app-title">LLMChats3</span>
        </div>
        <div className="header-right">
          <button
            className="icon-btn"
            onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      <main className="app-main">
        <LLMSelector
          providers={providers}
          neonModels={neonModels}
          selections={selections}
          onSelectionsChange={setSelections}
        />

        <div className="content">
          <PersonaAccordion
            isOpen={accordionOpen}
            onToggle={() => setAccordionOpen(o => !o)}
            personaA={personaA}
            personaB={personaB}
            onChangeA={setPersonaA}
            onChangeB={setPersonaB}
            selectedNameA={selectedNameA}
            selectedNameB={selectedNameB}
          />

          <ChatControls
            onStart={handleStart}
            onStop={handleStop}
            disabled={!canStart}
            isRunning={isRunning}
          />

          <ChatArea
            messages={messages}
            systemMessages={systemMessages}
            isRunning={isRunning}
            statusText={statusText}
          />

          <ExportBar sessionId={sessionId} />
        </div>
      </main>
    </div>
  );
}
