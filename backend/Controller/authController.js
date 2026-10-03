const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./User');

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret';

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({ name, email, passwordHash });
    await user.save();

    let token;
    try {
      token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    } catch (signErr) {
      console.error('JWT sign error during signup', signErr);
      return res.status(500).json({ message: 'Token generation failed' });
    }
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Unexpected signup error', err);
    // return more details in dev mode
    const msg = process.env.NODE_ENV === 'production' ? 'Server error' : (err.message || 'Server error');
    res.status(500).json({ message: msg });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    let token;
    try {
      token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
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
    const Expense = require('./Expense');
    const Budget = require('./Budget');
    const Goal = require('./Goal');
    const Reminder = require('./Reminder');
    const Account = require('./Account');
    const Tag = require('./Tag');

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
