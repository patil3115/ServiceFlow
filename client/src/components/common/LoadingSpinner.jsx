import React from 'react';

export const LoadingSpinner = ({ text = 'Loading...', size = 'md' }) => {
  const sizePx = size === 'sm' ? '18px' : size === 'lg' ? '36px' : '24px';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        gap: '12px',
        color: 'var(--text-secondary)'
      }}
    >
      <div
        style={{
          width: sizePx,
          height: sizePx,
          border: '2px solid rgba(59, 130, 246, 0.2)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      {text && <span style={{ fontSize: '13px', fontWeight: '500' }}>{text}</span>}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
