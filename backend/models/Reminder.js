const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date, required: true },
  isCompleted: { type: Boolean, default: false },
  recurring: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
}, { timestamps: true });

reminderSchema.index({ userId: 1, dueDate: 1 });
reminderSchema.index({ userId: 1, isCompleted: 1, dueDate: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
