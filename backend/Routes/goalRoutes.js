const express = require('express');
const { authenticateToken } = require('../Middleware/authMiddleware');
const {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
} = require('../Controller/goalController');

const router = express.Router();

router.post('/', authenticateToken, createGoal);
router.get('/', authenticateToken, getGoals);
router.get('/:id', authenticateToken, getGoalById);
router.put('/:id', authenticateToken, updateGoal);
router.delete('/:id', authenticateToken, deleteGoal);

module.exports = router;
