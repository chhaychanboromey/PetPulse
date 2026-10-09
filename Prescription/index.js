require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const dbConnect = require('./db-connect');

const app = express();
app.use(express.json());

dbConnect();

const prescriptionSchema = new mongoose.Schema({
  petId: { type: String, required: true },
  vetId: { type: String, required: true },
  diagnosis: { type: String, required: true },
  medicines: [{ name: String, dosage: String, duration: String }],
  status: { type: String, enum: ['Issued', 'Dispensed'], default: 'Issued' }
}, { timestamps: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema);

// Issue Prescription (Vet & Admin Only)
app.post('/api/v1/prescriptions', async (req, res) => {
  try {
    const requesterRole = req.headers['x-user-role'];
    if (!['vet', 'admin'].includes(requesterRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only Vets can issue prescriptions' });
    }

    const vetId = req.headers['x-user-id'];
    const { petId, diagnosis, medicines } = req.body;

    if (!petId || !diagnosis || !medicines || !medicines.length) {
      return res.status(400).json({ success: false, message: 'Pet ID, diagnosis, and medicines are required' });
    }

    const prescription = await Prescription.create({ petId, vetId, diagnosis, medicines });
    res.status(201).json({ success: true, prescription });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Fetch Prescriptions for Pet (Accessible to Owners)
app.get('/api/v1/prescriptions/pet/:petId', async (req, res) => {
  try {
    const list = await Prescription.find({ petId: req.params.petId });
    res.json({ success: true, list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Dispense Order (Vet & Admin Only)
app.patch('/api/v1/prescriptions/:id/dispense', async (req, res) => {
  try {
    const requesterRole = req.headers['x-user-role'];
    if (!['vet', 'admin'].includes(requesterRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
    }

    const item = await Prescription.findByIdAndUpdate(req.params.id, { status: 'Dispensed' }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Prescription not found' });

    res.json({ success: true, item });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
});

const PORT = process.env.PORT || 8005;
app.listen(PORT, () => console.log(`Prescription Microservice running on port ${PORT}`));