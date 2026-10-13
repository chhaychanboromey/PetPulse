require('dotenv').config();
const express = require('express');
const proxy = require('express-http-proxy');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || '2d649a9ea4e6aed305c193a43f3ecde951b2872e45cd44c61bd6ab5bb0547636';

const REGISTRATION_URL = process.env.REGISTRATION_URL || 'http://localhost:8001';
const LOGIN_URL        = process.env.LOGIN_URL        || 'http://localhost:8002';
const PET_URL          = process.env.PET_URL          || 'http://localhost:8003';
const APPOINTMENT_URL  = process.env.APPOINTMENT_URL  || 'http://localhost:8004';
const PRESCRIPTION_URL = process.env.PRESCRIPTION_URL || 'http://localhost:8005';
const BILLING_URL      = process.env.BILLING_URL      || 'http://localhost:8006';

// Middleware: Gateway-Level Role Authorization
const verifyRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access Denied: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ 
          success: false, 
          message: `Forbidden: ${decoded.role.toUpperCase()} tokens cannot access this endpoint` 
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  };
};

// Preserves original path so downstream microservices receive full route (/api/v1/...)
const passOriginalUrl = {
  proxyReqPathResolver: (req) => req.originalUrl,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    if (srcReq.user) {
      proxyReqOpts.headers['x-user-id'] = srcReq.user.userId || srcReq.user.id;
      proxyReqOpts.headers['x-user-role'] = srcReq.user.role;
    }
    return proxyReqOpts;
  }
};

// --- PUBLIC AUTH ROUTES ---
app.use('/api/v1/auth/register', proxy(REGISTRATION_URL, passOriginalUrl));
app.use('/api/v1/auth/login', proxy(LOGIN_URL, passOriginalUrl));

// --- PROTECTED ROUTES ---
app.use('/api/v1/pets', verifyRole(['owner', 'vet', 'admin']), proxy(PET_URL, passOriginalUrl));
app.use('/api/v1/appointments', verifyRole(['owner', 'vet', 'admin']), proxy(APPOINTMENT_URL, passOriginalUrl));
app.use('/api/v1/billing', verifyRole(['owner', 'vet', 'admin']), proxy(BILLING_URL, passOriginalUrl));

// Prescriptions: All authenticated users can view; creation restricted via downstream role check
app.use('/api/v1/prescriptions', verifyRole(['owner', 'vet', 'admin']), proxy(PRESCRIPTION_URL, passOriginalUrl));

app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));