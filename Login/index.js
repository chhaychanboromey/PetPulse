require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbConnect = require('./db-connect');

const app = express();
app.use(express.json());

dbConnect();

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

const JWT_SECRET = process.env.JWT_SECRET || 'petpulse_jwt_secret_key_2026';

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Username or Password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Username or Password' });
    }

    const token = jwt.sign(
      { userId: user._id, id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      role: user.role,
      userId: user._id
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 8002;
app.listen(PORT, () => console.log(`Login Service running on port ${PORT}`));