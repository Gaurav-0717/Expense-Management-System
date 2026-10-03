const express = require('express');
const { body, param, validationResult } = require('express-validator');
const controller = require('../controllers/expenseController');
const { authenticateToken } = require('../Middleware/authMiddleware');
const { error } = require('../Utils/response');

const router = express.Router();

// Debug: log incoming POST/PUT bodies so we can see what the server receives
router.use((req, res, next) => {
  if ((req.method === 'POST' || req.method === 'PUT') && req.path === '/') {
    console.log(`Incoming ${req.method} ${req.originalUrl} body:`, req.body);
  }
  if ((req.method === 'PUT' || req.method === 'POST') && req.path !== '/') {
    // also log put with id path
    console.log(`Incoming ${req.method} ${req.originalUrl} body:`, req.body);
  }
  next();
});

router.get('/', authenticateToken, async (req, res) => {
  try { await controller.listExpenses(req, res); } catch (e) { error(res, 'Server error', 500, e.message); }
});

// monthly report
router.get('/report', authenticateToken, async (req, res) => {
  try { await controller.monthlyReport(req, res); } catch (e) { error(res, 'Server error', 500, e.message); }
});

router.post('/', authenticateToken,
  // compatibility: if client still sends `purpose`, copy it to `category`
  (req, res, next) => {
    if (req.body && req.body.purpose && !req.body.category) req.body.category = req.body.purpose;
    next();
  },
  body('amount').isNumeric(),
  body('category').isLength({ min: 1 }),
  // accept flexible date input: allow ISO8601 or a plain date string (we'll coerce in controller)
  body('date').custom((val) => {
    if (!val) return false;
    // try Date parse
    const d = Date.parse(val);
    return !isNaN(d);
  }),
  body('type').optional().isIn(['Expense','Income']),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      console.error('Validation failed for POST /api/expenses:', errs.array());
      console.error('Request body:', req.body);
      return error(res, 'Validation failed', 400, errs.array());
    }
    try { await controller.createExpense(req, res); } catch (e) { error(res, 'Server error', 500, e.message); }
  }
);

router.put('/:id', authenticateToken,
  param('id').isMongoId(),
  // compatibility for earlier clients
  (req, res, next) => { if (req.body && req.body.purpose && !req.body.category) req.body.category = req.body.purpose; next(); },
  body('amount').optional().isNumeric(),
  body('category').optional().isLength({ min: 1 }),
  body('date').optional().custom((val) => { const d = Date.parse(val); return !isNaN(d); }),
  body('type').optional().isIn(['Expense','Income']),
  body('reference').optional().isString(),
  body('description').optional().isString(),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      console.error('Validation failed for PUT /api/expenses/:id:', errs.array());
      console.error('Request body:', req.body);
      return error(res, 'Validation failed', 400, errs.array());
    }
    try { await controller.updateExpense(req, res); } catch (e) { error(res, 'Server error', 500, e.message); }
  }
);

router.delete('/:id', authenticateToken, param('id').isMongoId(), async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return error(res, 'Validation failed', 400, errs.array());
  try { await controller.deleteExpense(req, res); } catch (e) { error(res, 'Server error', 500, e.message); }
});

module.exports = router;
