const mongoose = require('mongoose');

const cashoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    method: {
      type: String,
      trim: true,
      default: 'bank',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Cashout', cashoutSchema);
