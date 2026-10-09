require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const dbConnect = require('./db-connect');

const app = express();
app.use(express.json());

dbConnect();

const petSchema = new mongoose.Schema({
  name: { type: String, required: true },
  species: { type: String, required: true },
  breed: String,
  age: Number,
  ownerId: { type: String, required: true },
  medicalHistory: [String]
}, { timestamps: true });

const Pet = mongoose.model('Pet', petSchema);

// API 1: Register New Pet
app.post('/api/v1/pets', async (req, res) => {
  try {
    const ownerId = req.headers['x-user-id'] || req.body.ownerId;
    const { name, species, breed, age, medicalHistory } = req.body;

    const pet = await Pet.create({ name, species, breed, age, ownerId, medicalHistory });
    res.status(201).json({ success: true, pet });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API 2: Get Pets by Owner
app.get('/api/v1/pets/owner/:ownerId', async (req, res) => {
  try {
    const pets = await Pet.find({ ownerId: req.params.ownerId });
    res.json({ success: true, pets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API 3: Update Medical Records
app.put('/api/v1/pets/:id/medical-records', async (req, res) => {
  try {
    const { record } = req.body;
    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { $push: { medicalHistory: record } },
      { new: true }
    );
    res.json({ success: true, pet });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 8003;
app.listen(PORT, () => console.log(`Pet Service running on port ${PORT}`));