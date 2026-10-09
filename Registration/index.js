require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dbConnect = require('./db-connect');

const app = express();
app.use(express.json());

dbConnect();

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['owner', 'vet', 'admin', 'user'], default: 'owner' },
  phone: { type: String, required: true, trim: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const assignedRole = role ? role.toLowerCase().trim() : 'owner';

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      phone: phone.trim()
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => console.log(`Registration Service running on port ${PORT}`));