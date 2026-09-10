import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';

export const SLAIndicator = ({ sla, deadline, isBreached, status }) => {
  // Determine display properties from SLA data or ticket fields
  const isTerminal = ['RESOLVED', 'CLOSED'].includes(status);

  if (isTerminal) {
    const wasBreached = isBreached || sla?.isBreached;
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11px',
          fontWeight: '600',
          backgroundColor: wasBreached ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
          color: wasBreached ? '#f87171' : '#4ade80',
          border: `1px solid ${wasBreached ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
        }}
      >
        <CheckCircle2 size={12} />
        {wasBreached ? 'Resolved (Breached)' : 'Resolved in SLA'}
      </span>
    );
  }

  // Active in-flight calculation
  const now = new Date();
  const deadlineDate = deadline ? new Date(deadline) : null;
  const isCurrentlyBreached = isBreached || (deadlineDate && now > deadlineDate);
  const diffMs = deadlineDate ? Math.abs(deadlineDate - now) : 0;
  const isUnder1Hour = diffMs < 60 * 60 * 1000;
  const isUnder30Min = diffMs < 30 * 60 * 1000;

  let bg = 'rgba(59, 130, 246, 0.12)';
  let text = '#60a5fa';
  let border = 'rgba(59, 130, 246, 0.3)';
  let icon = <Clock size={12} />;
  let label = 'Within SLA';

  if (isCurrentlyBreached) {
    bg = 'rgba(239, 68, 68, 0.15)';
    text = '#f87171';
    border = 'rgba(239, 68, 68, 0.4)';
    icon = <Flame size={12} />;
    label = 'BREACHED';
  } else if (isUnder30Min) {
    bg = 'rgba(239, 68, 68, 0.12)';
    text = '#f87171';
    border = 'rgba(239, 68, 68, 0.3)';
    icon = <AlertTriangle size={12} />;
    label = '< 30m Left';
  } else if (isUnder1Hour) {
    bg = 'rgba(249, 115, 22, 0.12)';
    text = '#fb923c';
    border = 'rgba(249, 115, 22, 0.3)';
    icon = <AlertTriangle size={12} />;
    label = '< 1h Left';
  }

  // Text subtitle if provided by sla object
  const detailText = sla?.remainingTimeText || sla?.diffDurationText;

  return (
    <span
      title={deadlineDate ? `Deadline: ${deadlineDate.toLocaleString()}` : ''}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '11px',
        fontWeight: '600',
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap'
      }}
    >
      {icon}
      <span>{label}</span>
      {detailText && !isCurrentlyBreached && (
        <span style={{ opacity: 0.8, fontWeight: '500' }}>({detailText})</span>
      )}
    </span>
  );
};

export default SLAIndicator;
