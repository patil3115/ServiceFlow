import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Shield, AlertCircle, ArrowRight, CheckCircle2, User, KeyRound } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError('Please enter both email and password');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setFormError(res.error || 'Authentication failed. Please check credentials.');
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setFormError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary, #0f172a)',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-surface, #1e293b)',
          borderRadius: 'var(--radius-xl, 16px)',
          border: '1px solid var(--border-color, #334155)',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0,0,0,0.5))'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg, 12px)',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              fontWeight: '800',
              color: '#ffffff',
              fontSize: '22px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
            }}
          >
            SF
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: '700',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              margin: '0 0 6px 0'
            }}
          >
            Sign in to ServiceFlow
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Enterprise IT Service Desk & Incident Platform
          </p>
        </div>

        {/* Error Alert */}
        {formError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md, 8px)',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{formError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="login-email"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input, #0f172a)',
                border: '1px solid var(--border-color, #334155)',
                borderRadius: 'var(--radius-md, 8px)',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease'
              }}
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label
              htmlFor="login-password"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input, #0f172a)',
                border: '1px solid var(--border-color, #334155)',
                borderRadius: 'var(--radius-md, 8px)',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease'
              }}
            />
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: 'var(--radius-md, 8px)',
              backgroundColor: 'var(--primary, #3b82f6)',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
              transition: 'var(--transition-fast)'
            }}
          >
            <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Accounts Pill Selector */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color, #334155)'
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: '10px',
              textAlign: 'center'
            }}
          >
            Quick Demo Accounts (Click to Autofill)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@serviceflow.local', 'Admin@12345')}
              style={{
                padding: '8px 10px',
                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: 'var(--radius-md, 8px)',
                color: '#c084fc',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              👑 Admin Console
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('agent@serviceflow.local', 'Agent@12345')}
              style={{
                padding: '8px 10px',
                backgroundColor: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: 'var(--radius-md, 8px)',
                color: '#22d3ee',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              🛠️ Support Agent
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('employee@serviceflow.local', 'Employee@12345')}
              style={{
                padding: '8px 10px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 'var(--radius-md, 8px)',
                color: '#60a5fa',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              👤 Employee (John)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('elena@serviceflow.local', 'Employee@12345')}
              style={{
                padding: '8px 10px',
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 'var(--radius-md, 8px)',
                color: '#4ade80',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              👩‍💻 Employee (Elena)
            </button>
          </div>
        </div>

        {/* Register Link */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{ color: 'var(--primary, #3b82f6)', fontWeight: '600', textDecoration: 'none' }}
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
