import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import dashboardService from '../services/dashboardService';
import TicketTable from '../components/tickets/TicketTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Ticket,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  ArrowUpRight,
  PlusCircle,
  Activity,
  ShieldCheck
} from 'lucide-react';

export const Dashboard = () => {
  const { user, isAdmin, isAgent } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch customized metrics based on role
        const res = await dashboardService.getDashboard();
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.message || 'Failed to load dashboard metrics');
        }
      } catch (err) {
        setError(err.message || 'Error fetching dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.role]);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading enterprise dashboard metrics..." />;
  }

  if (error) {
    return (
      <div
        style={{
          padding: '24px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-lg)',
          color: '#f87171'
        }}
      >
        <div style={{ fontWeight: '600', marginBottom: '6px' }}>Dashboard Error</div>
        <div>{error}</div>
      </div>
    );
  }

  // --- 1. RENDER EMPLOYEE DASHBOARD ---
  if (!isAdmin && !isAgent) {
    const metrics = data?.metrics || { totalTickets: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
    const recentTickets = data?.recentTickets || [];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Welcome Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>
              Welcome back, {user?.name}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              {user?.department} • Employee IT Support Portal
            </p>
          </div>
          <Link
            to="/tickets/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: 'var(--primary, #3b82f6)',
              color: '#ffffff',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.35)'
            }}
          >
            <PlusCircle size={16} />
            <span>Create New Incident</span>
          </Link>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>My Total Incidents</span>
              <Ticket size={18} color="var(--primary)" />
            </div>
            <div style={cardValueStyle}>{metrics.totalTickets}</div>
          </div>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Open & Assigned</span>
              <Activity size={18} color="#60a5fa" />
            </div>
            <div style={{ ...cardValueStyle, color: '#60a5fa' }}>{metrics.open}</div>
          </div>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>In Progress</span>
              <Clock size={18} color="#facc15" />
            </div>
            <div style={{ ...cardValueStyle, color: '#facc15' }}>{metrics.inProgress}</div>
          </div>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Resolved & Closed</span>
              <CheckCircle2 size={18} color="#4ade80" />
            </div>
            <div style={{ ...cardValueStyle, color: '#4ade80' }}>{(metrics.resolved || 0) + (metrics.closed || 0)}</div>
          </div>
        </div>

        {/* Recent Tickets Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>My Recent Incidents</h2>
            <Link to="/tickets" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>
              View all tickets →
            </Link>
          </div>
          <TicketTable tickets={recentTickets} />
        </div>
      </div>
    );
  }

  // --- 2. RENDER SUPPORT AGENT DASHBOARD ---
  if (isAgent && !isAdmin) {
    const metrics = data?.metrics || { assignedTickets: 0, inProgress: 0, unassignedQueueCount: 0 };
    const myAssignedTickets = data?.urgentAssigned || [];
    const unassignedQueue = data?.unassignedQueue || [];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>
              Agent Operations Desk
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Logged in as {user?.name} • Service Operations & Incident Response
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              to="/sla"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#60a5fa',
                borderRadius: 'var(--radius-md, 8px)',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              <Clock size={16} />
              <span>SLA Performance Report</span>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Assigned to Me</span>
              <Ticket size={18} color="var(--primary)" />
            </div>
            <div style={cardValueStyle}>{metrics.assignedTickets || 0}</div>
          </div>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>In Progress</span>
              <Activity size={18} color="#facc15" />
            </div>
            <div style={{ ...cardValueStyle, color: '#facc15' }}>{metrics.inProgress || 0}</div>
          </div>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Unassigned Triage Queue</span>
              <AlertTriangle size={18} color="#fb923c" />
            </div>
            <div style={{ ...cardValueStyle, color: '#fb923c' }}>{metrics.unassignedQueueCount || 0}</div>
          </div>
        </div>

        {/* Unassigned Triage Queue Section */}
        {unassignedQueue.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fb923c' }} />
                <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Unassigned Incident Queue (Triage Required)</h2>
              </div>
            </div>
            <TicketTable tickets={unassignedQueue} />
          </div>
        )}

        {/* Assigned Incidents */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>My Active Workload</h2>
            <Link to="/tickets" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>
              View all tickets →
            </Link>
          </div>
          <TicketTable tickets={myAssignedTickets} />
        </div>
      </div>
    );
  }

  // --- 3. RENDER ADMINISTRATOR DASHBOARD ---
  const userStats = data?.userStats || { totalUsers: 0 };
  const ticketStats = data?.ticketStats || { totalTickets: 0, open: 0, assigned: 0, inProgress: 0, resolved: 0, closed: 0 };
  const categories = data?.categoryDistribution || [];
  const recentTickets = data?.recentTickets || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>
            Enterprise Governance Console
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Platform Overview • ServiceFlow Administrator: {user?.name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to="/sla"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            <Clock size={16} />
            <span>SLA Telemetry</span>
          </Link>
          <Link
            to="/users"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#c084fc',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none'
            }}
          >
            <Users size={16} />
            <span>User Directory</span>
          </Link>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Total Platform Incidents</span>
            <Ticket size={18} color="var(--primary)" />
          </div>
          <div style={cardValueStyle}>{ticketStats.totalTickets || 0}</div>
        </div>
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Active Workload</span>
            <Activity size={18} color="#60a5fa" />
          </div>
          <div style={{ ...cardValueStyle, color: '#60a5fa' }}>
            {(ticketStats.open || 0) + (ticketStats.assigned || 0) + (ticketStats.inProgress || 0)}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Resolved Incidents</span>
            <CheckCircle2 size={18} color="#4ade80" />
          </div>
          <div style={{ ...cardValueStyle, color: '#4ade80' }}>
            {(ticketStats.resolved || 0) + (ticketStats.closed || 0)}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Registered Identities</span>
            <Users size={18} color="#c084fc" />
          </div>
          <div style={{ ...cardValueStyle, color: '#c084fc' }}>{userStats.totalUsers || 0}</div>
        </div>
      </div>

      {/* Category Breakdown */}
      {categories.length > 0 && (
        <div style={{ ...cardStyle, padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '14px' }}>
            Incident Volume by Category
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {categories.map((c) => (
              <div
                key={c.category || c.name || c._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--border-color, #334155)',
                  fontSize: '12px'
                }}
              >
                <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{c.category || c.name || c._id}</span>
                <span
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    color: '#93c5fd',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}
                >
                  {c.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Incidents Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Recent Incidents System Feed</h2>
          <Link to="/tickets" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>
            View all tickets →
          </Link>
        </div>
        <TicketTable tickets={recentTickets} />
      </div>
    </div>
  );
};

const cardStyle = {
  backgroundColor: 'var(--bg-surface, #1e293b)',
  borderRadius: 'var(--radius-lg, 12px)',
  border: '1px solid var(--border-color, #334155)',
  padding: '18px 20px',
  boxShadow: 'var(--shadow-sm)'
};

const cardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '10px'
};

const cardValueStyle = {
  fontSize: '28px',
  fontWeight: '800',
  color: 'var(--text-primary)',
  letterSpacing: '-0.03em'
};

export default Dashboard;
