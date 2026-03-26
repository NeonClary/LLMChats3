import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatArea({ messages, systemMessages, isRunning, statusText }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, systemMessages]);

  const hasContent = messages.length > 0 || systemMessages.length > 0;

  return (
    <div className="chat-area">
      {!hasContent && !isRunning && (
        <div className="chat-empty">
          Select two LLMs, configure expert personas, and start a conversation.
        </div>
      )}

      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}

      {systemMessages.map((sys, i) => (
        <div
          key={`sys-${i}`}
          className={`system-message ${sys.text === 'End of Chat' ? 'end-of-chat' : ''}`}
        >
          {sys.text}
        </div>
      ))}

      {isRunning && statusText && (
        <div className="status-bar">
          <div className="spinner" />
          <span>{statusText}</span>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
