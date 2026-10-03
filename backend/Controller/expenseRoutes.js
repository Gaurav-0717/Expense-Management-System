const express = require('express');
const router = express.Router();
const expenseController = require('./expenseController');
const { authenticateToken } = require('../Middeleware/authMiddleware');

router.get('/', authenticateToken, expenseController.listExpenses);
router.post('/', authenticateToken, expenseController.createExpense);
router.put('/:id', authenticateToken, expenseController.updateExpense);
router.delete('/:id', authenticateToken, expenseController.deleteExpense);

module.exports = router;
