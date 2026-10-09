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

// Book Appointment
app.post('/api/v1/appointments', async (req, res) => {
  try {
    const ownerId = req.headers['x-user-id'];
    const { petId, vetId, appointmentDate } = req.body;

    if (!petId || !vetId || !appointmentDate) {
      return res.status(400).json({ success: false, message: 'Missing appointment details' });
    }

    const appointment = await Appointment.create({ petId, ownerId, vetId, appointmentDate });
    res.status(201).json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get Vet Schedule
app.get('/api/v1/appointments/vet/:vetId', async (req, res) => {
  try {
    const list = await Appointment.find({ vetId: req.params.vetId });
    res.json({ success: true, list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Status (Restricted to Vet & Admin)
app.patch('/api/v1/appointments/:id/status', async (req, res) => {
  try {
    const requesterRole = req.headers['x-user-role'];
    if (!['vet', 'admin'].includes(requesterRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only Vets and Admins can update status' });
    }

    const { status } = req.body;
    const updated = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    if (!updated) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, updated });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Invalid ID or status update failed' });
  }
});

const PORT = process.env.PORT || 8004;
app.listen(PORT, () => console.log(`Appointment Microservice running on port ${PORT}`));