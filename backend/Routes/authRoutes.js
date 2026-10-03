const express = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/authController');
const { authenticateToken } = require('../Middleware/authMiddleware');
const { error, success } = require('../Utils/response');

const router = express.Router();

router.post('/signup',
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters long'),
  body('email').normalizeEmail().isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 8, max: 128 }).matches(/^(?=.*[A-Za-z])(?=.*\d).+/).withMessage('Password must be 8+ characters and include letters and numbers'),
  async (req, res) => {
    const errs = validationResult(req);
      if (!errs.isEmpty()) {
        // Debug: log validation errors and request body to help trace 400 responses from browser
        console.error('Validation failed for /api/signup:', errs.array());
        console.error('Request body:', req.body);
        return error(res, 'Validation failed', 400, errs.array());
      }
    try {
      await controller.signup(req, res);
    } catch (e) { error(res, 'Server error', 500, e.message); }
  }
);

router.post('/login',
  body('email').normalizeEmail().isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters long'),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return error(res, 'Validation failed', 400, errs.array());
    try { await controller.login(req, res); } catch (e) { error(res, 'Server error', 500, e.message); }
  }
);

router.delete('/account', authenticateToken, async (req, res) => {
  try { await controller.deleteAccount(req, res); } catch (e) { error(res, 'Server error', 500, e.message); }
});

module.exports = router;
