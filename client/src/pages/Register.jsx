import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { AlertCircle, ArrowRight } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Engineering'
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.department) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const res = await register(formData);
    setSubmitting(false);

    if (res.success) {
      navigate('/', { replace: true });
    } else {
      setFormError(res.error || 'Registration failed. Please try again.');
    }
  };

  const departments = [
    'Engineering',
    'Product & Design',
    'Human Resources',
    'Finance & Accounting',
    'Sales & Marketing',
    'Customer Success',
    'Operations',
    'Legal'
  ];

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
            Join ServiceFlow
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Create your employee account to report and track IT requests
          </p>
        </div>

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="register-name"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}
            >
              Full Name
            </label>
            <input
              id="register-name"
              name="name"
              type="text"
              placeholder="e.g. Sarah Connor"
              value={formData.name}
              onChange={handleChange}
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
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="register-email"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}
            >
              Company Email
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
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
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="register-department"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}
            >
              Department
            </label>
            <select
              id="register-department"
              name="department"
              value={formData.department}
              onChange={handleChange}
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
                cursor: 'pointer'
              }}
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="register-password"
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}
            >
              Password (min. 6 characters)
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
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
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
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
            <span>{submitting ? 'Creating account...' : 'Create Account'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--primary, #3b82f6)', fontWeight: '600', textDecoration: 'none' }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
