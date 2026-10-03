const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret, getJwtOptions } = require('../Utils/jwt');

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedName = String(name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({ name: normalizedName, email: normalizedEmail, passwordHash });
    await user.save();

    let token;
    try {
      token = jwt.sign({ id: user._id, email: user.email }, getJwtSecret(), getJwtOptions());
    } catch (signErr) {
      console.error('JWT sign error during signup', signErr);
      return res.status(500).json({ message: 'Token generation failed' });
    }
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Unexpected signup error', err);
    const msg = process.env.NODE_ENV === 'production' ? 'Server error' : (err.message || 'Server error');
    res.status(500).json({ message: msg });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    let token;
    try {
      token = jwt.sign({ id: user._id, email: user.email }, getJwtSecret(), getJwtOptions());
    } catch (signErr) {
      console.error('JWT sign error during login', signErr);
      return res.status(500).json({ message: 'Token generation failed' });
    }
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Unexpected login error', err);
    const msg = process.env.NODE_ENV === 'production' ? 'Server error' : (err.message || 'Server error');
    res.status(500).json({ message: msg });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete all related data first
    const Expense = require('../models/Expense');
    const Budget = require('../models/Budget');
    const Goal = require('../models/Goal');
    const Reminder = require('../models/Reminder');
    const Account = require('../models/Account');
    const Tag = require('../models/Tag');

    await Promise.all([
      Expense.deleteMany({ userId }),
      Budget.deleteMany({ userId }),
      Goal.deleteMany({ userId }),
      Reminder.deleteMany({ userId }),
      Account.deleteMany({ userId }),
      Tag.deleteMany({ userId })
    ]);

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Account deletion error', err);
    res.status(500).json({ message: 'Server error' });
  }
};
