import React from 'react';

const statusConfig = {
  OPEN: {
    label: 'Open',
    bg: 'var(--status-open-bg)',
    text: 'var(--status-open-text)',
    border: 'var(--status-open-border)'
  },
  ASSIGNED: {
    label: 'Assigned',
    bg: 'var(--status-assigned-bg)',
    text: 'var(--status-assigned-text)',
    border: 'var(--status-assigned-border)'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'var(--status-inprogress-bg)',
    text: 'var(--status-inprogress-text)',
    border: 'var(--status-inprogress-border)'
  },
  PENDING: {
    label: 'Pending',
    bg: 'var(--status-pending-bg)',
    text: 'var(--status-pending-text)',
    border: 'var(--status-pending-border)'
  },
  RESOLVED: {
    label: 'Resolved',
    bg: 'var(--status-resolved-bg)',
    text: 'var(--status-resolved-text)',
    border: 'var(--status-resolved-border)'
  },
  CLOSED: {
    label: 'Closed',
    bg: 'var(--status-closed-bg)',
    text: 'var(--status-closed-text)',
    border: 'var(--status-closed-border)'
  }
};

export const StatusBadge = ({ status = 'OPEN', size = 'md' }) => {
  const config = statusConfig[status.toUpperCase()] || statusConfig.OPEN;
  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: isSmall ? '2px 8px' : '4px 10px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        fontSize: isSmall ? '11px' : '12px',
        fontWeight: '600',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap'
      }}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
