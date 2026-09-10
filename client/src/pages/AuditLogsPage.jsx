import React, { useState, useEffect } from 'react';
import auditService from '../services/auditService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { ScrollText, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalLogs: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        setError('');

        const params = { page, limit: 20 };
        if (actionFilter) params.action = actionFilter;

        const res = await auditService.getSystemAuditLogs(params);
        if (res.success) {
          setLogs(res.data);
          if (res.meta) {
            setPagination(res.meta);
          }
        } else {
          setError(res.message || 'Failed to retrieve system audit logs');
        }
      } catch (err) {
        setError(err.message || 'Error fetching system audit trail');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [page, actionFilter]);

  const auditActions = [
    'TICKET_CREATED',
    'TICKET_ASSIGNED',
    'STATUS_CHANGED',
    'PRIORITY_CHANGED',
    'TICKET_RESOLVED',
    'TICKET_CLOSED',
    'TICKET_REOPENED',
    'COMMENT_ADDED',
    'USER_ROLE_CHANGED',
    'USER_STATUS_CHANGED'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>
            System Audit Trail & Event Stream
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Immutable administrative event logging for compliance, governance, and security audits
          </p>
        </div>

        {/* Action Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="var(--text-muted)" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            style={{
              backgroundColor: 'var(--bg-input, #0f172a)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '8px 12px',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">All Audit Actions</option>
            {auditActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading system audit feed..." />
      ) : error ? (
        <div style={{ padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-lg)', color: '#f87171' }}>
          {error}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit logs found"
          description={actionFilter ? 'No events match the selected action filter.' : 'No audit records exist yet.'}
        />
      ) : (
        <>
          <div
            style={{
              backgroundColor: 'var(--bg-surface, #1e293b)',
              borderRadius: 'var(--radius-lg, 12px)',
              border: '1px solid var(--border-color, #334155)',
              overflow: 'hidden'
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      borderBottom: '1px solid var(--border-color, #334155)',
                      color: 'var(--text-muted)',
                      fontWeight: '600',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Timestamp</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Action</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Event Narrative</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Actor</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Target Incident</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log._id}
                      style={{ borderBottom: '1px solid var(--border-color, #334155)' }}
                    >
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '12px' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm, 6px)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: '#93c5fd'
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontWeight: '500' }}>
                        {log.narrative}
                      </td>
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: '600' }}>
                          {log.userId?.name || 'System'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                          {log.userId?.role || 'SYSTEM'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        {log.ticketId ? (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono, monospace)',
                              color: 'var(--primary)',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            {log.ticketId.ticketNumber || 'Ticket'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-surface, #1e293b)',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--border-color, #334155)',
                fontSize: '13px',
                color: 'var(--text-secondary)'
              }}
            >
              <div>
                Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> (
                {pagination.totalLogs} total events)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    backgroundColor: 'var(--bg-input, #0f172a)',
                    border: '1px solid var(--border-color, #334155)',
                    borderRadius: 'var(--radius-sm, 6px)',
                    color: pagination.hasPrevPage ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed',
                    fontSize: '12px'
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    backgroundColor: 'var(--bg-input, #0f172a)',
                    border: '1px solid var(--border-color, #334155)',
                    borderRadius: 'var(--radius-sm, 6px)',
                    color: pagination.hasNextPage ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
                    fontSize: '12px'
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLogsPage;
