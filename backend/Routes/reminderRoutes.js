const express = require('express');
const { authenticateToken } = require('../Middleware/authMiddleware');
const {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
} = require('../Controller/reminderController');

const router = express.Router();

router.post('/', authenticateToken, createReminder);
router.get('/', authenticateToken, getReminders);
router.get('/:id', authenticateToken, getReminderById);
router.put('/:id', authenticateToken, updateReminder);
router.delete('/:id', authenticateToken, deleteReminder);

module.exports = router;
