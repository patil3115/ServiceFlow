import React, { useState } from 'react';
import { Send } from 'lucide-react';

export const CommentForm = ({ onSubmit, loading = false, disabled = false }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading || disabled) return;

    await onSubmit(message.trim());
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: 'var(--bg-surface, #1e293b)',
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px solid var(--border-color, #334155)',
          padding: '12px'
        }}
      >
        <textarea
          rows={3}
          placeholder={
            disabled
              ? 'Ticket is closed. Adding comments is disabled.'
              : 'Add an update, note, or reply...'
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={disabled || loading}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(51, 65, 85, 0.4)',
            paddingTop: '8px'
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Shift+Enter for new line
          </span>
          <button
            type="submit"
            disabled={!message.trim() || loading || disabled}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: 'var(--primary, #3b82f6)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: !message.trim() || loading || disabled ? 'not-allowed' : 'pointer',
              opacity: !message.trim() || loading || disabled ? 0.6 : 1,
              transition: 'var(--transition-fast)'
            }}
          >
            <Send size={13} />
            <span>{loading ? 'Posting...' : 'Post Comment'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
