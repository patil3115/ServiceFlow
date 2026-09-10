import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ticketService from '../services/ticketService';
import categoryService from '../services/categoryService';
import { ArrowLeft, AlertCircle, Clock, ShieldAlert } from 'lucide-react';

export const TicketCreatePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getCategories();
        if (res.success && res.data.length > 0) {
          setCategories(res.data);
          setFormData((prev) => ({ ...prev, category: res.data[0].name }));
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.title.trim().length < 5) {
      setError('Title must be at least 5 characters long');
      return;
    }

    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    if (!formData.category) {
      setError('Please select an incident category');
      return;
    }

    try {
      setLoading(true);
      const res = await ticketService.createTicket({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        department: user?.department || 'General'
      });

      if (res.success && res.data) {
        const targetNumber = res.data.ticketNumber || res.data._id;
        navigate(`/tickets/${targetNumber}`);
      } else {
        setError(res.message || 'Failed to submit incident');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating incident');
    } finally {
      setLoading(false);
    }
  };

  const prioritySlaMap = {
    CRITICAL: '4 hours (High-severity outage / blocked operations)',
    HIGH: '8 hours (Major impact with business friction)',
    MEDIUM: '24 hours (Standard service request or minor issue)',
    LOW: '72 hours (Informational request or routine task)'
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Back link */}
      <Link
        to="/tickets"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: '13px',
          marginBottom: '16px'
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to incidents</span>
      </Link>

      <div
        style={{
          backgroundColor: 'var(--bg-surface, #1e293b)',
          borderRadius: 'var(--radius-xl, 16px)',
          border: '1px solid var(--border-color, #334155)',
          padding: '32px',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 4px 0' }}>
            Report an IT Incident
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Submit an enterprise ticket for assistance, hardware, software, or account access.
          </p>
        </div>

        {error && (
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
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Incident Title */}
          <div style={{ marginBottom: '18px' }}>
            <label
              htmlFor="ticket-title"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}
            >
              Incident Title *
            </label>
            <input
              id="ticket-title"
              name="title"
              type="text"
              placeholder="e.g. Cannot access VPN client after system update"
              value={formData.title}
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

          {/* Category & Priority Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
            <div>
              <label
                htmlFor="ticket-category"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px'
                }}
              >
                Category *
              </label>
              <select
                id="ticket-category"
                name="category"
                value={formData.category}
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
                {categories.map((c) => (
                  <option key={c._id || c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="ticket-priority"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px'
                }}
              >
                Urgency Priority *
              </label>
              <select
                id="ticket-priority"
                name="priority"
                value={formData.priority}
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
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          {/* SLA Notice Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '12px',
              color: '#93c5fd',
              marginBottom: '18px'
            }}
          >
            <Clock size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong>Target SLA Resolution:</strong> {prioritySlaMap[formData.priority]}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="ticket-description"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}
            >
              Detailed Description *
            </label>
            <textarea
              id="ticket-description"
              name="description"
              rows={5}
              placeholder="Describe the issue, error messages received, steps to reproduce, and any troubleshooting already attempted..."
              value={formData.description}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input, #0f172a)',
                border: '1px solid var(--border-color, #334155)',
                borderRadius: 'var(--radius-md, 8px)',
                padding: '12px 14px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            <Link
              to="/tickets"
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--border-color, #334155)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              Cancel
            </Link>
            <button
              id="submit-incident-btn"
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 22px',
                borderRadius: 'var(--radius-md, 8px)',
                border: 'none',
                backgroundColor: 'var(--primary, #3b82f6)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
              }}
            >
              {loading ? 'Submitting...' : 'Submit Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketCreatePage;
