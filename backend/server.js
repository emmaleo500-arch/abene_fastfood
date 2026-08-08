require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const connectDB   = require('./config/db');
const seedAdmin   = require('./utils/seedAdmin');

const authRoutes    = require('./routes/auth');
const orderRoutes   = require('./routes/orders');
const contactRoutes = require('./routes/contact');
const statsRoutes   = require('./routes/stats');

// ── Connect DB ────────────────────────────────────────────────────────────────
connectDB().then(seedAdmin);

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/orders',  orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stats',   statsRoutes);

// ── Serve admin dashboard (static) ───────────────────────────────────────────
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ success: true, message: 'Sarvoraa API is running ' })
);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`  Server running on http://localhost:${PORT}`)
);
