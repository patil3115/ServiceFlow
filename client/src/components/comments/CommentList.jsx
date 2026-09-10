import React from 'react';
import { MessageSquare, User } from 'lucide-react';

export const CommentList = ({ comments = [] }) => {
  if (!comments || comments.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
          backgroundColor: 'rgba(15, 23, 42, 0.3)',
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px dashed var(--border-color, #334155)'
        }}
      >
        <MessageSquare size={20} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
        No comments yet. Start the conversation below.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {comments.map((c) => {
        const author = c.author || c.userId || {};
        const isAgentOrAdmin = ['SUPPORT_AGENT', 'ADMIN'].includes(author.role);
        const createdAt = new Date(c.createdAt).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        return (
          <div
            key={c._id}
            style={{
              padding: '14px 16px',
              backgroundColor: isAgentOrAdmin
                ? 'rgba(59, 130, 246, 0.05)'
                : 'rgba(15, 23, 42, 0.5)',
              borderRadius: 'var(--radius-md, 8px)',
              border: `1px solid ${
                isAgentOrAdmin ? 'rgba(59, 130, 246, 0.25)' : 'var(--border-color, #334155)'
              }`
            }}
          >
            {/* Author Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isAgentOrAdmin
                      ? 'rgba(59, 130, 246, 0.2)'
                      : 'rgba(148, 163, 184, 0.2)',
                    color: isAgentOrAdmin ? 'var(--primary)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}
                >
                  {author.name ? author.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span
                  style={{
                    fontWeight: '600',
                    fontSize: '13px',
                    color: 'var(--text-primary)'
                  }}
                >
                  {author.name || 'User'}
                </span>
                {author.role && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isAgentOrAdmin
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(100, 116, 139, 0.15)',
                      color: isAgentOrAdmin ? '#60a5fa' : '#94a3b8'
                    }}
                  >
                    {author.role}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {createdAt}
              </span>
            </div>

            {/* Comment Message */}
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap'
              }}
            >
              {c.message}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default CommentList;
