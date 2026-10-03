const Expense = require('./Expense');

exports.listExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createExpense = async (req, res) => {
  try {
    // new shape: amount, type, category, date, reference, description
    const { amount, type, category, date, reference, description } = req.body;
    if (amount == null || !category || !date) return res.status(400).json({ message: 'Missing fields' });
    const expense = new Expense({ userId: req.user.id, amount, type: type || 'Expense', category, date: new Date(date), reference, description });
    await expense.save();
    res.json({ success: true, expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    // coerce date if present
    const update = { ...req.body };
    if (update.date) update.date = new Date(update.date);
    const updated = await Expense.findOneAndUpdate({ _id: id, userId: req.user.id }, update, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, expense: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Expense.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// monthly report: compares total expenses in requested month (YYYY-MM) to user's income
exports.monthlyReport = async (req, res) => {
  try {
    const userId = req.user.id;
    // optional query ?month=YYYY-MM, default to current month
    const month = req.query.month || (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; })();
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon - 1 + 1, 1);
  const expenses = await Expense.find({ userId, date: { $gte: start, $lt: end } });
  // heuristic: if a record has category like 'salary', 'pay', or 'income' but is stored as Expense, treat it as income
  const incomeKeywords = /salary|pay|income|salary/i;
  const isIncomeCandidate = (e) => {
    try { return e.category && incomeKeywords.test(e.category); } catch (err) { return false; }
  };
  // sum expenses and incomes separately, applying heuristic
  const totalExpenses = expenses.filter(e => ((e.type || 'Expense') === 'Expense') && !isIncomeCandidate(e)).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalIncomeRecorded = expenses.filter(e => ((e.type || 'Expense') === 'Income') || isIncomeCandidate(e)).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const User = require('./User');
    const user = await User.findById(userId).select('monthlyIncome name email');
  const income = (user && user.monthlyIncome) || 0;
  const remaining = income - totalExpenses;
  res.json({ success: true, month, total: totalExpenses, income, incomeRecorded: totalIncomeRecorded, remaining, expenses });
  } catch (err) {
    console.error('Monthly report error', err);
    res.status(500).json({ message: 'Server error' });
  }
};
