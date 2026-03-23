import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MessageBubble({ message }) {
  const isA = message.speaker_idx === 0;
  const side = isA ? 'a' : 'b';
  const initial = message.speaker ? message.speaker.charAt(0).toUpperCase() : (isA ? 'A' : 'B');

  return (
    <div className={`message-row speaker-${side}`}>
      <div className={`avatar avatar-${side}`}>
        {initial}
      </div>
      <div className={`message-bubble bubble-${side}`}>
        <div className="message-speaker">{message.speaker}</div>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.text}
        </ReactMarkdown>
      </div>
    </div>
  );
}
