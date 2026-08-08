const express = require('express');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const User             = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ── Helper: sign JWT ─────────────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = signToken(user._id);
      res.json({
        success: true,
        token,
        admin: { id: user._id, name: user.name, email: user.email },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── GET /api/auth/me  (protected) ────────────────────────────────────────────
router.get('/me', protect, adminOnly, (req, res) => {
  res.json({ success: true, admin: req.user });
});

module.exports = router;
