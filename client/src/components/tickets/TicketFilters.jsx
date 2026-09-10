import React from 'react';
import { Search, X, Filter } from 'lucide-react';

export const TicketFilters = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  category,
  onCategoryChange,
  categories = [],
  onReset
}) => {
  const hasActiveFilters = search || status || priority || category;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        backgroundColor: 'var(--bg-surface, #1e293b)',
        borderRadius: 'var(--radius-lg, 12px)',
        border: '1px solid var(--border-color, #334155)',
        marginBottom: '20px'
      }}
    >
      {/* Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--bg-input, #0f172a)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '8px 12px',
          flex: '1 1 240px',
          minWidth: '200px'
        }}
      >
        <Search size={16} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Search by ticket #, title, description..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '13px',
            width: '100%'
          }}
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              padding: 0
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Status Filter */}
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
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
        <option value="OPEN">Open</option>
        <option value="ASSIGNED">Assigned</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="PENDING">Pending</option>
        <option value="RESOLVED">Resolved</option>
        <option value="CLOSED">Closed</option>
      </select>

      {/* Priority Filter */}
      <select
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value)}
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
        <option value="">All Priorities</option>
        <option value="CRITICAL">Critical</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>

      {/* Category Filter */}
      {categories.length > 0 && (
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
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
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id || cat.name} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      )}

      {/* Clear Filters CTA */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            backgroundColor: 'transparent',
            border: '1px dashed var(--border-color, #334155)',
            borderRadius: 'var(--radius-md, 8px)',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'color 0.15s ease'
          }}
        >
          <X size={14} />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};

export default TicketFilters;
