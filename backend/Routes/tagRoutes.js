const express = require('express');
const { authenticateToken } = require('../Middleware/authMiddleware');
const {
  createTag,
  getTags,
  getTagById,
  updateTag,
  deleteTag,
} = require('../Controller/tagController');

const router = express.Router();

router.post('/', authenticateToken, createTag);
router.get('/', authenticateToken, getTags);
router.get('/:id', authenticateToken, getTagById);
router.put('/:id', authenticateToken, updateTag);
router.delete('/:id', authenticateToken, deleteTag);

module.exports = router;
