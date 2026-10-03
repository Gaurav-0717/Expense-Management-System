const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  category: { type: String, required: true },
  targetDate: { type: Date, required: true },
  description: { type: String },
  status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
