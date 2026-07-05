const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    usedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: [],
    }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PromoCode', promoCodeSchema);
