import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ticketService from '../services/ticketService';
import categoryService from '../services/categoryService';
import TicketFilters from '../components/tickets/TicketFilters';
import TicketTable from '../components/tickets/TicketTable';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { PlusCircle, ChevronLeft, ChevronRight, Ticket } from 'lucide-react';

export const TicketListPage = () => {
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Pagination States
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalTickets: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Fetch categories once
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryService.getCategories();
        if (res.success) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Fetch tickets on filter / page change
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page,
          limit: 10
        };
        if (search) params.search = search;
        if (status) params.status = status;
        if (priority) params.priority = priority;
        if (category) params.category = category;

        const res = await ticketService.getTickets(params);
        if (res.success) {
          setTickets(res.data);
          if (res.meta) {
            setPagination(res.meta);
          }
        } else {
          setError(res.message || 'Failed to retrieve tickets');
        }
      } catch (err) {
        setError(err.message || 'Error fetching tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [page, search, status, priority, category]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setCategory('');
    setPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
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
            Incident Directory
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Browse, search, and filter enterprise service requests
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
          <span>Report Incident</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <TicketFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
        priority={priority}
        onPriorityChange={(val) => {
          setPriority(val);
          setPage(1);
        }}
        category={category}
        onCategoryChange={(val) => {
          setCategory(val);
          setPage(1);
        }}
        categories={categories}
        onReset={handleResetFilters}
      />

      {/* Content Area */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading incidents..." />
      ) : error ? (
        <div
          style={{
            padding: '20px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-lg)',
            color: '#f87171'
          }}
        >
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No incidents found"
          description={
            search || status || priority || category
              ? 'No tickets match your filter criteria. Try adjusting your query.'
              : 'No incidents have been submitted yet.'
          }
          action={
            search || status || priority || category ? (
              <button
                onClick={handleResetFilters}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--primary, #3b82f6)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Clear Filters
              </button>
            ) : (
              <Link
                to="/tickets/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: 'var(--primary, #3b82f6)',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}
              >
                <PlusCircle size={14} />
                <span>Create Incident</span>
              </Link>
            )
          }
        />
      ) : (
        <>
          <TicketTable tickets={tickets} />

          {/* Pagination Controls */}
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
                Showing page <strong style={{ color: 'var(--text-primary)' }}>{pagination.page}</strong> of{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{pagination.totalPages}</strong> (
                {pagination.totalTickets} total incidents)
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

export default TicketListPage;
