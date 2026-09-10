import React from 'react';
import {
  PlusCircle,
  UserCheck,
  ArrowRightCircle,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RotateCcw,
  MessageSquare,
  Shield,
  Clock
} from 'lucide-react';

const getActionIcon = (action) => {
  switch (action) {
    case 'TICKET_CREATED':
      return <PlusCircle size={14} color="#3b82f6" />;
    case 'TICKET_ASSIGNED':
      return <UserCheck size={14} color="#a855f7" />;
    case 'STATUS_CHANGED':
      return <ArrowRightCircle size={14} color="#facc15" />;
    case 'PRIORITY_CHANGED':
      return <AlertTriangle size={14} color="#fb923c" />;
    case 'TICKET_RESOLVED':
      return <CheckCircle2 size={14} color="#4ade80" />;
    case 'TICKET_CLOSED':
      return <Lock size={14} color="#94a3b8" />;
    case 'TICKET_REOPENED':
      return <RotateCcw size={14} color="#f87171" />;
    case 'COMMENT_ADDED':
      return <MessageSquare size={14} color="#60a5fa" />;
    case 'USER_ROLE_CHANGED':
    case 'USER_STATUS_CHANGED':
      return <Shield size={14} color="#c084fc" />;
    default:
      return <Clock size={14} color="#94a3b8" />;
  }
};

export const AuditTimeline = ({ logs = [] }) => {
  if (!logs || logs.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px'
        }}
      >
        No audit events recorded for this incident.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '24px' }}>
      {/* Vertical line connecting events */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          bottom: '12px',
          left: '9px',
          width: '2px',
          backgroundColor: 'var(--border-color, #334155)'
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {logs.map((log) => {
          const timestamp = new Date(log.createdAt).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div
              key={log._id}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              {/* Timeline marker icon node */}
              <div
                style={{
                  position: 'absolute',
                  left: '-24px',
                  top: '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-surface, #1e293b)',
                  border: '1px solid var(--border-color, #334155)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2
                }}
              >
                {getActionIcon(log.action)}
              </div>

              {/* Event Content */}
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {log.narrative || `${log.action} performed`}
              </div>

              {/* Timestamp & Performed By */}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                <span>{timestamp}</span>
                {log.userId?.role && (
                  <span>• Actor: {log.userId.name || 'System'} ({log.userId.role})</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AuditTimeline;
