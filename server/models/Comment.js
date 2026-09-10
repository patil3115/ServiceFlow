const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: [true, 'Comment must be linked to a ticket']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment must have an author']
    },
    message: {
      type: String,
      required: [true, 'Comment message cannot be empty'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters']
    }
  },
  {
    timestamps: true
  }
);

// Indexes: Chronological listing of comments per ticket
commentSchema.index({ ticketId: 1, createdAt: 1 });
commentSchema.index({ userId: 1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
