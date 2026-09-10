import React, { useState, useEffect } from 'react';
import api from './services/api';
import { Shield, Activity, Users, Ticket, CheckCircle, AlertCircle, Clock } from 'lucide-react';

function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        setLoading(true);
        const res = await api.get('/health');
        setHealth(res.data);
        setError(null);
      } catch (err) {
        console.error('Health check failed:', err);
        setError(err.message || 'Could not connect to backend server');
      } finally {
        setLoading(false);
      }
    };

    checkServerHealth();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            color: '#fff',
            fontSize: '18px'
          }}>
            SF
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em', margin: 0 }}>
              ServiceFlow
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Enterprise IT Service Desk & Incident Management
            </p>
          </div>
        </div>

        {/* System Health Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: health ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${health ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            fontSize: '12px',
            fontWeight: '500'
          }}>
            <Activity size={14} color={health ? '#4ade80' : '#f87171'} />
            <span style={{ color: health ? '#4ade80' : '#f87171' }}>
              {loading ? 'Checking API...' : health ? 'API Connected (Port 5000)' : 'API Disconnected'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '36px 24px' }}>
        <div className="container" style={{ maxWidth: '1100px' }}>
          {/* Welcome Banner */}
          <div className="card" style={{ marginBottom: '28px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderColor: 'var(--primary-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="badge badge-open" style={{ marginBottom: '12px' }}>Phase 1 Initialized</span>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                  IT Service Desk & Incident Management Platform
                </h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', fontSize: '14px', lineHeight: '1.6' }}>
                  Realistic enterprise service desk simulating internal IT workflows: employee incident reporting,
                  SLA tracking, role-based ticket investigation, assignment, resolution cycles, and audit logging.
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-medium">Development Mode</span>
                <p className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Client: Vite 5 (Port 5173)<br />
                  Server: Express 4 (Port 5000)
                </p>
              </div>
            </div>
          </div>

          {/* System Roles Grid */}
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Multi-Role Architecture
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {/* Employee Card */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                  <Ticket size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '600' }}>Employee Role</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ticket submitter & consumer</p>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={14} color="#4ade80" /> Report incidents (Hardware, Software, Network)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={14} color="#4ade80" /> Track personal tickets with SLA countdowns
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={14} color="#4ade80" /> Add comments & confirm ticket resolution
                </li>
              </ul>
            </div>

            {/* Support Agent Card */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                  <Users size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '600' }}>Support Agent Role</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Incident investigator & resolver</p>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={14} color="#4ade80" /> Claim unassigned tickets & manage workload
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={14} color="#4ade80" /> Update lifecycle (In Progress, Pending, Resolved)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={14} color="#4ade80" /> Document root causes and resolution notes
                </li>
              </ul>
            </div>

            {/* Administrator Card */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ padding: '8px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#facc15' }}>
                  <Shield size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '600' }}>Administrator Role</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>System governance & oversight</p>
                </div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={14} color="#4ade80" /> Manage user accounts, roles & activations
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={14} color="#4ade80" /> Manage incident categories & assignments
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={14} color="#4ade80" /> Comprehensive audit logs & system analytics
                </li>
              </ul>
            </div>
          </div>

          {/* Backend Connection Diagnostic */}
          <div className="card">
            <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>
              Backend Connection Diagnostic
            </h4>
            {loading ? (
              <p style={{ color: 'var(--text-muted)' }}>Querying backend at {api.defaults.baseURL}...</p>
            ) : error ? (
              <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Successfully connected to backend API:
                </p>
                <pre className="font-mono" style={{
                  padding: '12px',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  color: '#4ade80',
                  fontSize: '12px',
                  overflowX: 'auto'
                }}>
                  {JSON.stringify(health, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '12px'
      }}>
        ServiceFlow &bull; Enterprise IT Service Desk & Incident Management Platform &bull; Phase 1 Verified
      </footer>
    </div>
  );
}

export default App;
