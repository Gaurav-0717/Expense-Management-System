const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, unique: true },
  color: { type: String, default: '#3b82f6' },
  icon: { type: String },
}, { timestamps: true });

tagSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('Tag', tagSchema);
