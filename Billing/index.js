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

// Create Invoice (Vet & Admin Only)
app.post('/api/v1/billing/invoices', async (req, res) => {
  try {
    const requesterRole = req.headers['x-user-role'];
    if (!['vet', 'admin'].includes(requesterRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Only Vets and Admins create invoices' });
    }

    const { appointmentId, ownerId, amount } = req.body;

    if (!appointmentId || !ownerId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid appointmentId, ownerId, and positive amount required' });
    }

    const invoice = await Invoice.create({ appointmentId, ownerId, amount });
    res.status(201).json({ success: true, invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Pay Invoice (Ownership Check)
app.post('/api/v1/billing/pay', async (req, res) => {
  try {
    const requesterId = req.headers['x-user-id'];
    const requesterRole = req.headers['x-user-role'];
    const { invoiceId } = req.body;

    if (!invoiceId) return res.status(400).json({ success: false, message: 'Invoice ID is required' });

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    if (requesterRole === 'owner' && invoice.ownerId !== requesterId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only pay your own invoices' });
    }

    invoice.status = 'PAID';
    await invoice.save();

    res.json({ success: true, message: 'Payment processed successfully', invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
});

// Fetch Invoice
app.get('/api/v1/billing/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    res.json({ success: true, invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
});

const PORT = process.env.PORT || 8006;
app.listen(PORT, () => console.log(`Billing Microservice running on port ${PORT}`));