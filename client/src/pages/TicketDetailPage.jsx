import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ticketService from '../services/ticketService';
import commentService from '../services/commentService';
import userService from '../services/userService';
import PriorityBadge from '../components/common/PriorityBadge';
import StatusBadge from '../components/common/StatusBadge';
import SLAIndicator from '../components/common/SLAIndicator';
import CommentList from '../components/comments/CommentList';
import CommentForm from '../components/comments/CommentForm';
import AuditTimeline from '../components/audit/AuditTimeline';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  ArrowLeft,
  User,
  Clock,
  Shield,
  MessageSquare,
  ScrollText,
  Play,
  CheckCircle2,
  Pause,
  RotateCcw,
  Lock,
  UserCheck,
  AlertCircle
} from 'lucide-react';

export const TicketDetailPage = () => {
  const { id } = useParams();
  const { user, isAdmin, isAgent } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [slaData, setSlaData] = useState(null);
  const [comments, setComments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'timeline'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals for actions
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');

  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [pendingReason, setPendingReason] = useState('');

  // Agents list for assignment (Admin/Agent)
  const [agentsList, setAgentsList] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  const loadTicketData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [ticketRes, commentsRes, auditRes, slaRes] = await Promise.all([
        ticketService.getTicketById(id),
        commentService.getComments(id),
        ticketService.getTicketAuditLogs(id),
        ticketService.getTicketSla(id).catch(() => null)
      ]);

      if (ticketRes.success) {
        setTicket(ticketRes.data);
      }
      if (commentsRes.success) {
        setComments(commentsRes.data);
      }
      if (auditRes.success) {
        setAuditLogs(auditRes.data);
      }
      if (slaRes && slaRes.success) {
        setSlaData(slaRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load incident details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicketData();
  }, [loadTicketData]);

  // Load agents for assign modal if agent/admin
  useEffect(() => {
    if (isAgent || isAdmin) {
      userService.getUsers({ role: 'SUPPORT_AGENT' }).then((res) => {
        if (res.success && res.data) {
          setAgentsList(res.data);
        }
      }).catch(() => {});
    }
  }, [isAgent, isAdmin]);

  // Handler: Assign to self
  const handleAssignSelf = async () => {
    try {
      setActionLoading(true);
      await ticketService.assignTicket(id, user._id);
      await loadTicketData();
    } catch (err) {
      alert(err.message || 'Assignment failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Assign to specific agent
  const handleAssignSubmit = async () => {
    if (!selectedAgentId) return;
    try {
      setActionLoading(true);
      await ticketService.assignTicket(id, selectedAgentId);
      setAssignModalOpen(false);
      await loadTicketData();
    } catch (err) {
      alert(err.message || 'Assignment failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Start Working (ASSIGNED -> IN_PROGRESS)
  const handleStartWork = async () => {
    try {
      setActionLoading(true);
      await ticketService.updateStatus(id, 'IN_PROGRESS', 'Investigation started by support agent');
      await loadTicketData();
    } catch (err) {
      alert(err.message || 'Status transition failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Mark Pending
  const handleMarkPending = async () => {
    try {
      setActionLoading(true);
      await ticketService.updateStatus(id, 'PENDING', pendingReason || 'Awaiting customer response / third-party update');
      setPendingModalOpen(false);
      setPendingReason('');
      await loadTicketData();
    } catch (err) {
      alert(err.message || 'Failed to mark pending');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Resume Progress (PENDING -> IN_PROGRESS)
  const handleResume = async () => {
    try {
      setActionLoading(true);
      await ticketService.updateStatus(id, 'IN_PROGRESS', 'Resumed investigation');
      await loadTicketData();
    } catch (err) {
      alert(err.message || 'Resume failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Resolve Ticket
  const handleResolveSubmit = async () => {
    if (!resolveNotes.trim()) {
      alert('Please provide resolution notes explaining how the incident was solved');
      return;
    }
    try {
      setActionLoading(true);
      await ticketService.resolveTicket(id, resolveNotes.trim());
      setResolveModalOpen(false);
      setResolveNotes('');
      await loadTicketData();
    } catch (err) {
      alert(err.message || 'Resolution failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Confirm & Close
  const handleConfirmClose = async () => {
    try {
      setActionLoading(true);
      await ticketService.closeTicket(id, 'Resolution accepted and closed');
      setCloseDialogOpen(false);
      await loadTicketData();
    } catch (err) {
      alert(err.message || 'Failed to close ticket');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Reopen Ticket
  const handleReopenSubmit = async () => {
    if (!reopenReason.trim()) {
      alert('Please provide a reason for reopening this incident');
      return;
    }
    try {
      setActionLoading(true);
      await ticketService.reopenTicket(id, reopenReason.trim());
      setReopenModalOpen(false);
      setReopenReason('');
      await loadTicketData();
    } catch (err) {
      alert(err.message || 'Failed to reopen ticket');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Priority update (Admin)
  const handlePriorityChange = async (newPriority) => {
    try {
      setActionLoading(true);
      await ticketService.updatePriority(id, newPriority);
      await loadTicketData();
    } catch (err) {
      alert(err.message || 'Priority update failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Post comment
  const handleAddComment = async (text) => {
    try {
      const res = await commentService.addComment(id, text);
      if (res.success && res.data) {
        setComments((prev) => [...prev, res.data]);
        // Also refresh audit logs in background
        ticketService.getTicketAuditLogs(id).then((r) => r.success && setAuditLogs(r.data));
      }
    } catch (err) {
      alert(err.message || 'Failed to post comment');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading incident details..." />;
  }

  if (error || !ticket) {
    return (
      <div style={{ padding: '24px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-lg)', color: '#f87171' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>Incident Error</h2>
        <p style={{ margin: '0 0 16px 0' }}>{error || 'Incident could not be found'}</p>
        <Link to="/tickets" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>
          ← Return to incident directory
        </Link>
      </div>
    );
  }

  const isOwner = user?._id === ticket.createdBy?._id;
  const isAssigned = user?._id === ticket.assignedTo?._id;
  const canOperate = isAgent || isAdmin;
  const isClosed = ticket.status === 'CLOSED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Back button */}
      <Link
        to="/tickets"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: '13px'
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to incident list</span>
      </Link>

      {/* Incident Header Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface, #1e293b)',
          borderRadius: 'var(--radius-xl, 16px)',
          border: '1px solid var(--border-color, #334155)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: '700',
                  color: 'var(--primary, #3b82f6)',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontSize: '14px'
                }}
              >
                {ticket.ticketNumber}
              </span>
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
              <SLAIndicator
                sla={slaData}
                deadline={ticket.slaDeadline}
                isBreached={ticket.isSlaBreached}
                status={ticket.status}
              />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              {ticket.title}
            </h1>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Reported by <strong>{ticket.createdBy?.name}</strong> ({ticket.department}) on{' '}
              {new Date(ticket.createdAt).toLocaleString()}
            </div>
          </div>

          {/* Administrative Priority Override */}
          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Priority:</span>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                disabled={actionLoading || isClosed}
                style={{
                  backgroundColor: 'var(--bg-input, #0f172a)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color, #334155)',
                  borderRadius: 'var(--radius-sm, 6px)',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          )}
        </div>

        {/* State Machine Action Bar */}
        {!isClosed && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '10px',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color, #334155)'
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginRight: '4px' }}>
              Workflow Actions:
            </span>

            {/* If OPEN / unassigned: Assign */}
            {canOperate && !ticket.assignedTo && (
              <>
                <button
                  onClick={handleAssignSelf}
                  disabled={actionLoading}
                  style={actionBtnStyle('var(--primary, #3b82f6)')}
                >
                  <UserCheck size={14} />
                  <span>Assign to Me</span>
                </button>
                <button
                  onClick={() => setAssignModalOpen(true)}
                  disabled={actionLoading}
                  style={actionBtnStyle('rgba(59, 130, 246, 0.2)', '#60a5fa')}
                >
                  <span>Assign to Agent...</span>
                </button>
              </>
            )}

            {/* If ASSIGNED: Start Progress */}
            {canOperate && ticket.status === 'ASSIGNED' && (
              <button
                onClick={handleStartWork}
                disabled={actionLoading}
                style={actionBtnStyle('#eab308')}
              >
                <Play size={14} />
                <span>Start Working (In Progress)</span>
              </button>
            )}

            {/* If IN_PROGRESS: Pending or Resolve */}
            {canOperate && ticket.status === 'IN_PROGRESS' && (
              <>
                <button
                  onClick={() => setPendingModalOpen(true)}
                  disabled={actionLoading}
                  style={actionBtnStyle('rgba(249, 115, 22, 0.2)', '#fb923c')}
                >
                  <Pause size={14} />
                  <span>Mark as Pending...</span>
                </button>
                <button
                  onClick={() => setResolveModalOpen(true)}
                  disabled={actionLoading}
                  style={actionBtnStyle('#22c55e')}
                >
                  <CheckCircle2 size={14} />
                  <span>Resolve Incident...</span>
                </button>
              </>
            )}

            {/* If PENDING: Resume Progress */}
            {canOperate && ticket.status === 'PENDING' && (
              <button
                onClick={handleResume}
                disabled={actionLoading}
                style={actionBtnStyle('#eab308')}
              >
                <Play size={14} />
                <span>Resume Progress</span>
              </button>
            )}

            {/* If RESOLVED: Owner or Admin can confirm Close or Reopen */}
            {ticket.status === 'RESOLVED' && (
              <>
                {(isOwner || isAdmin) && (
                  <button
                    onClick={() => setCloseDialogOpen(true)}
                    disabled={actionLoading}
                    style={actionBtnStyle('#475569')}
                  >
                    <Lock size={14} />
                    <span>Confirm & Close Ticket</span>
                  </button>
                )}
                {(isOwner || isAdmin || isAgent) && (
                  <button
                    onClick={() => setReopenModalOpen(true)}
                    disabled={actionLoading}
                    style={actionBtnStyle('rgba(239, 68, 68, 0.2)', '#f87171')}
                  >
                    <RotateCcw size={14} />
                    <span>Reopen Incident...</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(360px, 1.3fr)', gap: '20px' }}>
        {/* Left Column: Metadata Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Details Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface, #1e293b)',
              borderRadius: 'var(--radius-lg, 12px)',
              border: '1px solid var(--border-color, #334155)',
              padding: '20px'
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 14px 0' }}>
              Incident Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Category</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{ticket.category}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>Assigned Agent</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                  {ticket.assignedTo ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserCheck size={14} color="var(--primary)" />
                      <span>{ticket.assignedTo.name}</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px' }}>SLA Target Deadline</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                  {ticket.slaDeadline ? new Date(ticket.slaDeadline).toLocaleString() : 'Not configured'}
                </div>
              </div>

              {/* Resolution Notes (if resolved) */}
              {ticket.resolution?.notes && (
                <div
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.08)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: 'var(--radius-md, 8px)',
                    padding: '12px',
                    marginTop: '4px'
                  }}
                >
                  <div style={{ color: '#4ade80', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Resolution Summary
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.4 }}>
                    {ticket.resolution.notes}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px' }}>
                    Resolved at {new Date(ticket.resolution.resolvedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Description Body */}
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color, #334155)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>
                Description
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {ticket.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Tabs (Comments & Audit Trail) */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface, #1e293b)',
            borderRadius: 'var(--radius-lg, 12px)',
            border: '1px solid var(--border-color, #334155)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Tab Navigation */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid var(--border-color, #334155)',
              paddingBottom: '12px',
              marginBottom: '16px'
            }}
          >
            <button
              onClick={() => setActiveTab('comments')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md, 8px)',
                border: 'none',
                backgroundColor: activeTab === 'comments' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: activeTab === 'comments' ? '#60a5fa' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <MessageSquare size={16} />
              <span>Discussion ({comments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md, 8px)',
                border: 'none',
                backgroundColor: activeTab === 'timeline' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: activeTab === 'timeline' ? '#60a5fa' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <ScrollText size={16} />
              <span>Audit Timeline ({auditLogs.length})</span>
            </button>
          </div>

          {/* Active Tab Content */}
          <div style={{ flex: 1 }}>
            {activeTab === 'comments' ? (
              <div>
                <CommentList comments={comments} />
                <CommentForm
                  onSubmit={handleAddComment}
                  disabled={isClosed}
                />
              </div>
            ) : (
              <AuditTimeline logs={auditLogs} />
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Resolve Incident */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Resolve Incident"
        footer={
          <>
            <button
              onClick={() => setResolveModalOpen(false)}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleResolveSubmit}
              disabled={actionLoading}
              style={{ padding: '8px 16px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '600', cursor: 'pointer' }}
            >
              {actionLoading ? 'Saving...' : 'Submit Resolution'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
            Please detail the root cause, steps taken, and confirmation of resolution.
          </p>
          <textarea
            rows={4}
            placeholder="e.g. Replaced damaged Ethernet patch cable and verified Gigabit link negotiation..."
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-input, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '10px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </Modal>

      {/* MODAL: Mark Pending */}
      <Modal
        isOpen={pendingModalOpen}
        onClose={() => setPendingModalOpen(false)}
        title="Place Incident on Pending Hold"
        footer={
          <>
            <button
              onClick={() => setPendingModalOpen(false)}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleMarkPending}
              disabled={actionLoading}
              style={{ padding: '8px 16px', backgroundColor: '#fb923c', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '600', cursor: 'pointer' }}
            >
              {actionLoading ? 'Saving...' : 'Mark Pending'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
            State the reason for pausing work (e.g. awaiting vendor part, user reply required):
          </p>
          <input
            type="text"
            placeholder="e.g. Waiting for user to supply MAC address"
            value={pendingReason}
            onChange={(e) => setPendingReason(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-input, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '10px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </Modal>

      {/* MODAL: Reopen Incident */}
      <Modal
        isOpen={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
        title="Reopen Incident"
        footer={
          <>
            <button
              onClick={() => setReopenModalOpen(false)}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleReopenSubmit}
              disabled={actionLoading}
              style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '600', cursor: 'pointer' }}
            >
              {actionLoading ? 'Reopening...' : 'Confirm Reopen'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
            Explain why this incident is being reopened (e.g. issue recurrence, solution failed):
          </p>
          <textarea
            rows={3}
            placeholder="e.g. The printer started jamming again on tray 2 after 10 prints..."
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-input, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '10px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </Modal>

      {/* MODAL: Assign to Agent */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Incident to Support Agent"
        footer={
          <>
            <button
              onClick={() => setAssignModalOpen(false)}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleAssignSubmit}
              disabled={!selectedAgentId || actionLoading}
              style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '600', cursor: 'pointer' }}
            >
              {actionLoading ? 'Assigning...' : 'Assign Incident'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Select Support Agent:
          </label>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-input, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '10px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              boxSizing: 'border-box',
              cursor: 'pointer'
            }}
          >
            <option value="">-- Choose Agent --</option>
            {agentsList.map((ag) => (
              <option key={ag._id} value={ag._id}>
                {ag.name} ({ag.email})
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* CONFIRM DIALOG: Close Incident */}
      <ConfirmDialog
        isOpen={closeDialogOpen}
        onClose={() => setCloseDialogOpen(false)}
        onConfirm={handleConfirmClose}
        title="Confirm Ticket Closure"
        message="Are you satisfied with the resolution? Closing this incident will lock further edits and finish the lifecycle."
        confirmText="Confirm & Close"
        loading={actionLoading}
      />
    </div>
  );
};

const actionBtnStyle = (bg, textColor = '#ffffff') => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '7px 14px',
  backgroundColor: bg,
  color: textColor,
  border: 'none',
  borderRadius: 'var(--radius-md, 8px)',
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'opacity 0.15s ease'
});

export default TicketDetailPage;
