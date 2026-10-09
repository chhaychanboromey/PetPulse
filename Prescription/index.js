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

// API 1: Issue Prescription
app.post('/api/v1/prescriptions', async (req, res) => {
  try {
    const vetId = req.headers['x-user-id'] || req.body.vetId;
    const { petId, diagnosis, medicines } = req.body;

    const prescription = await Prescription.create({
      petId,
      vetId,
      diagnosis,
      medicines
    });

    res.status(201).json({ success: true, prescription });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API 2: Get Pet Prescriptions
app.get('/api/v1/prescriptions/pet/:petId', async (req, res) => {
  try {
    const list = await Prescription.find({ petId: req.params.petId });
    res.json({ success: true, list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API 3: Dispense Pharmacy Order
app.patch('/api/v1/prescriptions/:id/dispense', async (req, res) => {
  try {
    const item = await Prescription.findByIdAndUpdate(req.params.id, { status: 'Dispensed' }, { new: true });
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 8005;
app.listen(PORT, () => console.log(`Prescription Service running on port ${PORT}`));