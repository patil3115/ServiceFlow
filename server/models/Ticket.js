const mongoose = require('mongoose');

const resolutionSchema = new mongoose.Schema(
  {
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: [true, 'Ticket number is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Please provide an incident title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed description of the incident'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please select an incident category'],
      trim: true
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        message: '{VALUE} is not a valid priority level'
      },
      default: 'MEDIUM'
    },
    status: {
      type: String,
      enum: {
        values: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'],
        message: '{VALUE} is not a valid ticket status'
      },
      default: 'OPEN'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Ticket must have a creator']
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    department: {
      type: String,
      required: [true, 'Department is required for routing'],
      trim: true
    },
    resolution: {
      type: resolutionSchema,
      default: () => ({})
    },
    closedAt: {
      type: Date,
      default: null
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reopenedAt: {
      type: Date,
      default: null
    },
    reopenReason: {
      type: String,
      trim: true,
      default: null
    },
    slaDeadline: {
      type: Date,
      required: [true, 'SLA deadline must be calculated and set upon creation']
    },
    isSlaBreached: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// High-Performance Query & Index Design
ticketSchema.index({ createdBy: 1, status: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ slaDeadline: 1, status: 1 });
ticketSchema.index({ createdAt: -1 });

// Full-text search index across identifier, title, and description
ticketSchema.index(
  {
    ticketNumber: 'text',
    title: 'text',
    description: 'text'
  },
  {
    weights: {
      ticketNumber: 10,
      title: 5,
      description: 1
    },
    name: 'TicketTextSearchIndex'
  }
);

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
