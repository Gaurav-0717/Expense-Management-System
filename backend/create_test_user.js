const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./Controller/User');

require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/expense';

async function createTestUser() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: 'test@example.com' });
    if (existing) {
      console.log('Test user already exists');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('test123', salt);

    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash,
      monthlyIncome: 5000,
    });

    await user.save();
    console.log('Test user created successfully');
    console.log('Email: test@example.com');
    console.log('Password: test123');
  } catch (err) {
    console.error('Error creating test user:', err);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUser();
