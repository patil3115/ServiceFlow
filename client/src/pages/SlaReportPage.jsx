import React, { useState, useEffect } from 'react';
import slaService from '../services/slaService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Activity,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export const SlaReportPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [syncMessage, setSyncMessage] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await slaService.getSlaReport();
      if (res.success) {
        setReport(res.data);
      } else {
        setError(res.message || 'Failed to load SLA performance metrics');
      }
    } catch (err) {
      setError(err.message || 'Error loading SLA report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage('');
      const res = await slaService.syncBreachFlags();
      if (res.success) {
        setSyncMessage(`SLA scan completed: ${res.data.flaggedCount} newly breached tickets flagged.`);
        await fetchReport();
      }
    } catch (err) {
      alert(err.message || 'Failed to sync breach flags');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Calculating live SLA performance metrics..." />;
  }

  if (error) {
    return (
      <div style={{ padding: '24px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-lg)', color: '#f87171' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>SLA Reporting Error</h2>
        <p style={{ margin: 0 }}>{error}</p>
      </div>
    );
  }

  const { overall, resolvedIncidents, activeWorkload, priorityBreakdown } = report || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>
            SLA Performance & Compliance Telemetry
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Enterprise Service Level Agreement tracking, live threshold warnings, and breach analytics
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: 'var(--radius-md, 8px)',
            color: '#60a5fa',
            fontSize: '13px',
            fontWeight: '600',
            cursor: syncing ? 'not-allowed' : 'pointer',
            opacity: syncing ? 0.7 : 1
          }}
        >
          <RefreshCw size={15} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
          <span>{syncing ? 'Scanning...' : 'Sync Breach Telemetry'}</span>
        </button>
      </div>

      {syncMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 'var(--radius-md, 8px)',
            color: '#4ade80',
            fontSize: '13px'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Overall Compliance Rate</span>
            <ShieldCheck size={18} color="#4ade80" />
          </div>
          <div style={{ ...cardValueStyle, color: '#4ade80' }}>
            {overall?.complianceRate || '100%'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {overall?.totalCompliant || 0} of {overall?.totalTickets || 0} incidents compliant
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Total Breaches</span>
            <Flame size={18} color="#f87171" />
          </div>
          <div style={{ ...cardValueStyle, color: overall?.totalBreached > 0 ? '#f87171' : 'var(--text-primary)' }}>
            {overall?.totalBreached || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Active breaches + historical breaches
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Active In-Flight Incidents</span>
            <Activity size={18} color="#60a5fa" />
          </div>
          <div style={cardValueStyle}>{activeWorkload?.activeInFlight || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {activeWorkload?.activeWithinSla || 0} within SLA • {activeWorkload?.activeBreached || 0} breached
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Resolved Incidents</span>
            <CheckCircle2 size={18} color="#4ade80" />
          </div>
          <div style={cardValueStyle}>{resolvedIncidents?.totalResolvedOrClosed || 0}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {resolvedIncidents?.resolvedWithinSla || 0} within SLA • {resolvedIncidents?.resolvedBreached || 0} breached
          </div>
        </div>
      </div>

      {/* Priority Breakdown Matrix */}
      {priorityBreakdown && (
        <div style={{ ...cardStyle, padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
            SLA Compliance by Incident Priority Tier
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {Object.entries(priorityBreakdown).map(([prio, stat]) => {
              const compliance = stat.total > 0
                ? (((stat.total - stat.breached) / stat.total) * 100).toFixed(0) + '%'
                : '100%';

              return (
                <div
                  key={prio}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: '1px solid var(--border-color, #334155)',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>{prio}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: stat.breached > 0 ? '#f87171' : '#4ade80' }}>
                      {compliance}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Total Incidents: <strong>{stat.total}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: stat.breached > 0 ? '#f87171' : 'var(--text-muted)' }}>
                    Breached: <strong>{stat.breached}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SLA Policies Reference Card */}
      <div style={{ ...cardStyle, padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
          Enterprise Service Level Agreements Reference
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '13px' }}>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ fontWeight: '700', color: '#f87171', marginBottom: '2px' }}>CRITICAL</div>
            <div style={{ color: 'var(--text-secondary)' }}>Target Deadline: <strong>4 hours</strong></div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Severity 1 system outage</div>
          </div>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
            <div style={{ fontWeight: '700', color: '#fb923c', marginBottom: '2px' }}>HIGH</div>
            <div style={{ color: 'var(--text-secondary)' }}>Target Deadline: <strong>8 hours</strong></div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Major functional impairment</div>
          </div>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div style={{ fontWeight: '700', color: '#60a5fa', marginBottom: '2px' }}>MEDIUM</div>
            <div style={{ color: 'var(--text-secondary)' }}>Target Deadline: <strong>24 hours</strong></div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Standard service request</div>
          </div>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(100, 116, 139, 0.08)', border: '1px solid rgba(100, 116, 139, 0.2)' }}>
            <div style={{ fontWeight: '700', color: '#94a3b8', marginBottom: '2px' }}>LOW</div>
            <div style={{ color: 'var(--text-secondary)' }}>Target Deadline: <strong>72 hours</strong></div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Routine request or inquiry</div>
          </div>
        </div>
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

export default SlaReportPage;
