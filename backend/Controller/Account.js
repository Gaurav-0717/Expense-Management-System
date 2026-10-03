const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['checking', 'savings', 'credit', 'investment', 'cash'], required: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  institution: { type: String },
  accountNumber: { type: String },
  description: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);
