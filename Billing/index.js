require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const dbConnect = require('./db-connect');

const app = express();
app.use(express.json());

dbConnect();

const invoiceSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true },
  ownerId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['UNPAID', 'PAID'], default: 'UNPAID' }
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);

// API 1: Generate Invoice
app.post('/api/v1/billing/invoices', async (req, res) => {
  try {
    const ownerId = req.headers['x-user-id'] || req.body.ownerId;
    const { appointmentId, amount } = req.body;

    const invoice = await Invoice.create({ appointmentId, ownerId, amount });
    res.status(201).json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API 2: Pay Invoice
app.post('/api/v1/billing/pay', async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const invoice = await Invoice.findByIdAndUpdate(invoiceId, { status: 'PAID' }, { new: true });
    res.json({ success: true, message: 'Payment processed successfully', invoice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API 3: Get Invoice Details
app.get('/api/v1/billing/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    res.json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 8006;
app.listen(PORT, () => console.log(`Billing Service running on port ${PORT}`));