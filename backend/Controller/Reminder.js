const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  amount: { type: Number },
  dueDate: { type: Date, required: true },
  frequency: { type: String, enum: ['once', 'weekly', 'monthly', 'yearly'], default: 'once' },
  category: { type: String },
  isRecurring: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'completed', 'overdue'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
