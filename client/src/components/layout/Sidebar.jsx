import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Clock,
  Users,
  ScrollText,
  Activity,
  Layers
} from 'lucide-react';

export const Sidebar = () => {
  const { user, isAdmin, isAgent } = useAuth();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['EMPLOYEE', 'SUPPORT_AGENT', 'ADMIN']
    },
    {
      label: 'All Incidents',
      path: '/tickets',
      icon: Ticket,
      roles: ['EMPLOYEE', 'SUPPORT_AGENT', 'ADMIN']
    },
    {
      label: 'Report Incident',
      path: '/tickets/new',
      icon: PlusCircle,
      roles: ['EMPLOYEE', 'SUPPORT_AGENT', 'ADMIN']
    }
  ];

  const agentItems = [
    {
      label: 'SLA Telemetry',
      path: '/sla',
      icon: Clock,
      roles: ['SUPPORT_AGENT', 'ADMIN']
    }
  ];

  const adminItems = [
    {
      label: 'User Directory',
      path: '/users',
      icon: Users,
      roles: ['ADMIN']
    },
    {
      label: 'Audit Timeline',
      path: '/audit-logs',
      icon: ScrollText,
      roles: ['ADMIN']
    }
  ];

  const renderNavLink = (item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === '/'}
        style={({ isActive }) => ({
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md, 8px)',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: isActive ? '600' : '500',
          color: isActive ? '#ffffff' : 'var(--text-secondary)',
          backgroundColor: isActive ? 'var(--primary, #3b82f6)' : 'transparent',
          boxShadow: isActive ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
          transition: 'all 0.15s ease'
        })}
      >
        <Icon size={18} />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: 'var(--bg-surface, #1e293b)',
        borderRight: '1px solid var(--border-color, #334155)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: 'calc(100vh - 64px)',
        position: 'sticky',
        top: '64px',
        overflowY: 'auto'
      }}
    >
      <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            padding: '6px 12px 4px 12px'
          }}
        >
          Incident Workspace
        </div>
        {navItems.map(renderNavLink)}

        {(isAgent || isAdmin) && (
          <>
            <div
              style={{
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                padding: '16px 12px 4px 12px'
              }}
            >
              Operations & SLA
            </div>
            {agentItems.map(renderNavLink)}
          </>
        )}

        {isAdmin && (
          <>
            <div
              style={{
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                padding: '16px 12px 4px 12px'
              }}
            >
              System Governance
            </div>
            {adminItems.map(renderNavLink)}
          </>
        )}
      </div>

      {/* System Status Footer */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-color, #334155)',
          backgroundColor: 'rgba(15, 23, 42, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            boxShadow: '0 0 8px #22c55e'
          }}
        />
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>System Operational</div>
          <div>MongoDB + Express API</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
