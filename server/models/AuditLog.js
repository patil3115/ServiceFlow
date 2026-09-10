const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      default: null
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Audit log must record the performing user']
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      enum: {
        values: [
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
        ],
        message: '{VALUE} is not a valid audit action'
      }
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    // Audit logs are strictly append-only; disable updatedAt
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Indexes: Chronological ticket timeline & user audit trail
auditLogSchema.index({ ticketId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
