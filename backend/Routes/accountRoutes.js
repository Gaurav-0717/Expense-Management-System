const express = require('express');
const { authenticateToken } = require('../Middleware/authMiddleware');
const {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
} = require('../Controller/accountController');

const router = express.Router();

router.post('/', authenticateToken, createAccount);
router.get('/', authenticateToken, getAccounts);
router.get('/:id', authenticateToken, getAccountById);
router.put('/:id', authenticateToken, updateAccount);
router.delete('/:id', authenticateToken, deleteAccount);

module.exports = router;
