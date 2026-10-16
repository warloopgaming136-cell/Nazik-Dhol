const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();

// ---------- Core middleware ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Basic rate limiting for the public API (helps protect booking/auth endpoints)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------- API routes ----------
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/packages', require('./routes/packageRoutes'));
app.use('/api/team', require('./routes/teamRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/dates', require('./routes/dateRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Nazik Dhol API is running', time: new Date().toISOString() });
});

app.get('/api/config/public', (req, res) => {
  res.json({
    success: true,
    whatsappNumber: process.env.WHATSAPP_NUMBER || '',
  });
});

// ---------- Serve frontend (static site) ----------
const frontendDir = path.join(__dirname, '..', 'frontend');
// frontend/index.html, about.html, etc. are served directly from frontendDir
app.use(express.static(frontendDir));
// frontend/public/css, /js, /images are served at root (so <link href="/css/style.css">
// and <script src="/js/main.js"> in the HTML resolve correctly)
app.use(express.static(path.join(frontendDir, 'public')));

// Any non-API GET request that doesn't match a static file falls back to
// its matching .html page if present, otherwise index.html (SPA-style fallback).
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// ---------- Error handler (must be last) ----------
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n  Nazik Dhol server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`  Visit: http://localhost:${PORT}\n`);
  });
}

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
});

module.exports = app;
