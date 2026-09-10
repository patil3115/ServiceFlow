import React from 'react';

const priorityConfig = {
  CRITICAL: {
    label: 'Critical',
    bg: 'var(--priority-critical-bg)',
    text: 'var(--priority-critical-text)',
    border: 'var(--priority-critical-border, rgba(239, 68, 68, 0.4))',
    dot: '#ef4444'
  },
  HIGH: {
    label: 'High',
    bg: 'var(--priority-high-bg)',
    text: 'var(--priority-high-text)',
    border: 'rgba(249, 115, 22, 0.3)',
    dot: '#f97316'
  },
  MEDIUM: {
    label: 'Medium',
    bg: 'var(--priority-medium-bg)',
    text: 'var(--priority-medium-text)',
    border: 'rgba(59, 130, 246, 0.3)',
    dot: '#3b82f6'
  },
  LOW: {
    label: 'Low',
    bg: 'var(--priority-low-bg)',
    text: 'var(--priority-low-text)',
    border: 'rgba(100, 116, 139, 0.3)',
    dot: '#94a3b8'
  }
};

export const PriorityBadge = ({ priority = 'MEDIUM', size = 'md' }) => {
  const config = priorityConfig[priority.toUpperCase()] || priorityConfig.MEDIUM;
  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '4px' : '6px',
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
      <span
        style={{
          width: isSmall ? '5px' : '6px',
          height: isSmall ? '5px' : '6px',
          borderRadius: '50%',
          backgroundColor: config.dot,
          boxShadow: `0 0 6px ${config.dot}`
        }}
      />
      {config.label}
    </span>
  );
};

export default PriorityBadge;
