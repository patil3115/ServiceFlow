import React from 'react';
import { useNavigate } from 'react-router-dom';
import PriorityBadge from '../common/PriorityBadge';
import StatusBadge from '../common/StatusBadge';
import SLAIndicator from '../common/SLAIndicator';
import { ChevronRight, User } from 'lucide-react';

export const TicketTable = ({ tickets = [] }) => {
  const navigate = useNavigate();

  if (!tickets || tickets.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: 'var(--bg-surface, #1e293b)',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--border-color, #334155)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '13px'
          }}
        >
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
              <th style={{ padding: '14px 18px' }}>Ticket #</th>
              <th style={{ padding: '14px 18px' }}>Title</th>
              <th style={{ padding: '14px 18px' }}>Priority</th>
              <th style={{ padding: '14px 18px' }}>Status</th>
              <th style={{ padding: '14px 18px' }}>Category</th>
              <th style={{ padding: '14px 18px' }}>SLA Target</th>
              <th style={{ padding: '14px 18px' }}>Assignee</th>
              <th style={{ padding: '14px 18px' }}>Created</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => {
              const createdDate = new Date(t.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              });

              return (
                <tr
                  key={t._id || t.ticketNumber}
                  onClick={() => navigate(`/tickets/${t.ticketNumber || t._id}`)}
                  style={{
                    borderBottom: '1px solid var(--border-color, #334155)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  {/* Ticket Number */}
                  <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: '700',
                        color: 'var(--primary, #3b82f6)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm, 6px)',
                        fontSize: '12px'
                      }}
                    >
                      {t.ticketNumber}
                    </span>
                  </td>

                  {/* Title & Creator */}
                  <td style={{ padding: '14px 18px', maxWidth: '300px' }}>
                    <div
                      style={{
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {t.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      By {t.createdBy?.name || 'Unknown'} {t.department ? `• ${t.department}` : ''}
                    </div>
                  </td>

                  {/* Priority */}
                  <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                    <PriorityBadge priority={t.priority} size="sm" />
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                    <StatusBadge status={t.status} size="sm" />
                  </td>

                  {/* Category */}
                  <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        backgroundColor: 'rgba(148, 163, 184, 0.1)',
                        color: 'var(--text-secondary)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}
                    >
                      {t.category}
                    </span>
                  </td>

                  {/* SLA Indicator */}
                  <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                    <SLAIndicator
                      deadline={t.slaDeadline}
                      isBreached={t.isSlaBreached}
                      status={t.status}
                    />
                  </td>

                  {/* Assignee */}
                  <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                    {t.assignedTo ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: '700'
                          }}
                        >
                          {t.assignedTo.name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ color: 'var(--text-primary)', fontSize: '12px' }}>
                          {t.assignedTo.name}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Created At */}
                  <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {createdDate}
                  </td>

                  {/* View Arrow */}
                  <td style={{ padding: '14px 18px', textAlign: 'right', color: 'var(--text-muted)' }}>
                    <ChevronRight size={16} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketTable;
