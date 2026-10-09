require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const dbConnect = require('./db-connect');

const app = express();
app.use(express.json());

dbConnect();

const appointmentSchema = new mongoose.Schema({
  petId: { type: String, required: true },
  ownerId: { type: String, required: true },
  vetId: { type: String, required: true },
  appointmentDate: { type: Date, required: true },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' }
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

// API 1: Book Appointment
app.post('/api/v1/appointments', async (req, res) => {
  try {
    const ownerId = req.headers['x-user-id'] || req.body.ownerId;
    const { petId, vetId, appointmentDate } = req.body;

    const appointment = await Appointment.create({
      petId,
      ownerId,
      vetId,
      appointmentDate
    });

    res.status(201).json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API 2: Get Vet Appointments
app.get('/api/v1/appointments/vet/:vetId', async (req, res) => {
  try {
    const list = await Appointment.find({ vetId: req.params.vetId });
    res.json({ success: true, list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API 3: Update Appointment Status
app.patch('/api/v1/appointments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 8004;
app.listen(PORT, () => console.log(`Appointment Service running on port ${PORT}`));