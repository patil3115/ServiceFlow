import React, { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';
import useAuth from '../hooks/useAuth';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

export const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalUsers: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Action Modals
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('EMPLOYEE');

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [pendingStatusUser, setPendingStatusUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.isActive = statusFilter;

      const res = await userService.getUsers(params);
      if (res.success) {
        setUsers(res.data);
        if (res.meta) {
          setPagination(res.meta);
        }
      } else {
        setError(res.message || 'Failed to retrieve user directory');
      }
    } catch (err) {
      setError(err.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handler: Open role modal
  const openRoleModal = (u) => {
    setSelectedUser(u);
    setNewRole(u.role);
    setRoleModalOpen(true);
  };

  // Handler: Submit role update
  const handleRoleSubmit = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const res = await userService.updateUserRole(selectedUser._id, newRole);
      if (res.success) {
        setRoleModalOpen(false);
        await fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'Role update failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Open status toggle
  const openStatusDialog = (u) => {
    setPendingStatusUser(u);
    setStatusDialogOpen(true);
  };

  // Handler: Confirm status toggle
  const handleStatusConfirm = async () => {
    if (!pendingStatusUser) return;
    try {
      setActionLoading(true);
      const res = await userService.updateUserStatus(
        pendingStatusUser._id,
        !pendingStatusUser.isActive
      );
      if (res.success) {
        setStatusDialogOpen(false);
        await fetchUsers();
      }
    } catch (err) {
      alert(err.message || 'Status update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
      case 'SUPPORT_AGENT':
        return { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>
          User Directory & Governance
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          Manage organizational identities, role authorization, and account activation states
        </p>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          backgroundColor: 'var(--bg-surface, #1e293b)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--border-color, #334155)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-input, #0f172a)',
            border: '1px solid var(--border-color, #334155)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '8px 12px',
            flex: '1 1 240px'
          }}
        >
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by name, email, department..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '13px',
              width: '100%'
            }}
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
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
          <option value="">All Roles</option>
          <option value="ADMIN">Administrator</option>
          <option value="SUPPORT_AGENT">Support Agent</option>
          <option value="EMPLOYEE">Employee</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
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
          <option value="">All Statuses</option>
          <option value="true">Active Only</option>
          <option value="false">Deactivated Only</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Loading user directory..." />
      ) : error ? (
        <div style={{ padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-lg)', color: '#f87171' }}>
          {error}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="No organizational identities match your current filter settings."
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
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>User Name</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Email Address</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Department</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Role</th>
                    <th style={{ padding: '14px 18px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const roleStyle = getRoleStyle(u.role);
                    const isSelf = currentUser?._id === u._id;

                    return (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color, #334155)' }}>
                        <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: '700'
                              }}
                            >
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                              {u.name} {isSelf && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>(You)</span>}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                          {u.email}
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                          {u.department}
                        </td>
                        <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: roleStyle.bg,
                              color: roleStyle.text,
                              border: `1px solid ${roleStyle.border}`
                            }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: u.isActive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: u.isActive ? '#4ade80' : '#f87171',
                              border: `1px solid ${u.isActive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                            }}
                          >
                            {u.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => openRoleModal(u)}
                              disabled={actionLoading}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                                border: '1px solid rgba(168, 85, 247, 0.3)',
                                borderRadius: 'var(--radius-sm)',
                                color: '#c084fc',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Change Role
                            </button>
                            <button
                              onClick={() => openStatusDialog(u)}
                              disabled={actionLoading}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: u.isActive ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                                border: `1px solid ${u.isActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                                borderRadius: 'var(--radius-sm)',
                                color: u.isActive ? '#f87171' : '#4ade80',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                {pagination.totalUsers} total users)
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

      {/* MODAL: Change Role */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={`Change Role: ${selectedUser?.name}`}
        footer={
          <>
            <button
              onClick={() => setRoleModalOpen(false)}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleRoleSubmit}
              disabled={actionLoading}
              style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '600', cursor: 'pointer' }}
            >
              {actionLoading ? 'Updating...' : 'Save Role'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
            Select the new permission role for <strong>{selectedUser?.name}</strong>:
          </p>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-input, #0f172a)',
              border: '1px solid var(--border-color, #334155)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '10px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <option value="EMPLOYEE">EMPLOYEE (Standard reporting access)</option>
            <option value="SUPPORT_AGENT">SUPPORT_AGENT (Operations & lifecycle triage)</option>
            <option value="ADMIN">ADMIN (Full governance & system control)</option>
          </select>

          {selectedUser?.role === 'ADMIN' && newRole !== 'ADMIN' && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                padding: '10px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#f87171',
                fontSize: '12px'
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>Demoting an Administrator requires at least one other active Administrator.</span>
            </div>
          )}
        </div>
      </Modal>

      {/* CONFIRM DIALOG: Toggle Status */}
      <ConfirmDialog
        isOpen={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        onConfirm={handleStatusConfirm}
        title={pendingStatusUser?.isActive ? 'Deactivate User Account' : 'Reactivate User Account'}
        message={
          pendingStatusUser?.isActive
            ? `Are you sure you want to deactivate ${pendingStatusUser?.name}? They will be blocked from logging in until reactivated.`
            : `Are you sure you want to reactivate ${pendingStatusUser?.name}?`
        }
        confirmText={pendingStatusUser?.isActive ? 'Deactivate' : 'Reactivate'}
        isDanger={pendingStatusUser?.isActive}
        loading={actionLoading}
      />
    </div>
  );
};

export default UsersPage;
