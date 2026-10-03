const express = require('express');
const { authenticateToken } = require('../Middleware/authMiddleware');
const {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
} = require('../Controller/budgetController');

const router = express.Router();

router.post('/', authenticateToken, createBudget);
router.get('/', authenticateToken, getBudgets);
router.get('/:id', authenticateToken, getBudgetById);
router.put('/:id', authenticateToken, updateBudget);
router.delete('/:id', authenticateToken, deleteBudget);

module.exports = router;
