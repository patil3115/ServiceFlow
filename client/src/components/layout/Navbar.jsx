import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { PlusCircle, LogOut, User, Shield, LifeBuoy, Bell } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAdmin, isAgent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    if (isAdmin) {
      return {
        label: 'ADMIN',
        bg: 'rgba(168, 85, 247, 0.15)',
        text: '#c084fc',
        border: 'rgba(168, 85, 247, 0.3)'
      };
    }
    if (isAgent) {
      return {
        label: 'SUPPORT AGENT',
        bg: 'rgba(6, 182, 212, 0.15)',
        text: '#22d3ee',
        border: 'rgba(6, 182, 212, 0.3)'
      };
    }
    return {
      label: 'EMPLOYEE',
      bg: 'rgba(59, 130, 246, 0.15)',
      text: '#60a5fa',
      border: 'rgba(59, 130, 246, 0.3)'
    };
  };

  const roleStyle = getRoleBadge();

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--bg-surface, #1e293b)',
        borderBottom: '1px solid var(--border-color, #334155)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md, 8px)',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              color: '#ffffff',
              fontSize: '18px',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.35)'
            }}
          >
            SF
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '17px',
                  fontWeight: '700',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)'
                }}
              >
                ServiceFlow
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  color: '#93c5fd',
                  letterSpacing: '0.05em'
                }}
              >
                v1.0
              </span>
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                lineHeight: 1.2
              }}
            >
              Enterprise IT Service Desk
            </div>
          </div>
        </Link>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Create Incident CTA */}
        <Link
          to="/tickets/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 14px',
            backgroundColor: 'var(--primary, #3b82f6)',
            color: '#ffffff',
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: '13px',
            fontWeight: '600',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.35)',
            transition: 'var(--transition-fast)'
          }}
        >
          <PlusCircle size={16} />
          <span>New Incident</span>
        </Link>

        {/* User Identity Chip */}
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 12px',
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--border-color, #334155)'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: '700'
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.3 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{user.name}</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: roleStyle.bg,
                    color: roleStyle.text,
                    border: `1px solid ${roleStyle.border}`
                  }}
                >
                  {roleStyle.label}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {user.department || 'General'}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              style={{
                marginLeft: '6px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
