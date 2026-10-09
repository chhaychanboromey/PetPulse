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

// Create Pet
app.post('/api/v1/pets', async (req, res) => {
  try {
    const requesterId = req.headers['x-user-id'];
    const { name, species, breed, age, medicalHistory } = req.body;

    if (!name || !species) {
      return res.status(400).json({ success: false, message: 'Name and species are required' });
    }

    const pet = await Pet.create({ name, species, breed, age, ownerId: requesterId, medicalHistory });
    res.status(201).json({ success: true, pet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get Pets by Owner (Prevents ID spoofing)
app.get('/api/v1/pets/owner/:ownerId', async (req, res) => {
  try {
    const requesterId = req.headers['x-user-id'];
    const requesterRole = req.headers['x-user-role'];

    if (requesterRole === 'owner' && requesterId !== req.params.ownerId) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot access other users pets' });
    }

    const pets = await Pet.find({ ownerId: req.params.ownerId });
    res.json({ success: true, pets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Medical Records
app.put('/api/v1/pets/:id/medical-records', async (req, res) => {
  try {
    const { record } = req.body;
    if (!record) return res.status(400).json({ success: false, message: 'Record entry required' });

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { $push: { medicalHistory: record } },
      { new: true }
    );

    if (!pet) return res.status(404).json({ success: false, message: 'Pet record not found' });
    res.json({ success: true, pet });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Invalid ID format or operation failed' });
  }
});

const PORT = process.env.PORT || 8003;
app.listen(PORT, () => console.log(`Pet Profile Microservice running on port ${PORT}`));