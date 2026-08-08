const express = require('express');
const { body, validationResult } = require('express-validator');

const ContactMessage = require('../models/ContactMessage');
const sendMail       = require('../config/mailer');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/contact  (public) ──────────────────────────────────────────────
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('message').isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { name, email, subject, message } = req.body;

    try {
      const msg = await ContactMessage.create({ name, email, subject, message });

      // Email the admin
      await sendMail({
        to:      process.env.ADMIN_NOTIFY_EMAIL,
        subject: `✉️ New Contact: ${subject || 'General enquiry'} — from ${name}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1e1b18;
                      color:#f0ece6;border-radius:16px;overflow:hidden;">
            <div style="background:#d4a373;padding:20px 24px;">
              <h1 style="margin:0;color:#121212;font-size:1.2rem;">✉️ New Message — Sarvoraa</h1>
            </div>
            <div style="padding:24px;font-size:.9rem;">
              <p><strong>From:</strong> ${name} (${email})</p>
              <p><strong>Subject:</strong> ${subject || '—'}</p>
              <hr style="border-color:#3d3630;margin:12px 0;">
              <p style="white-space:pre-wrap;">${message}</p>
            </div>
          </div>`,
      });

      // Also send a confirmation to the sender
      await sendMail({
        to:      email,
        subject: `We got your message, ${name}! — Sarvoraa`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#1e1b18;
                      color:#f0ece6;border-radius:16px;overflow:hidden;">
            <div style="background:#d4a373;padding:20px 24px;">
              <h1 style="margin:0;color:#121212;font-size:1.2rem;">Thanks for reaching out!</h1>
            </div>
            <div style="padding:24px;font-size:.9rem;line-height:1.7;">
              <p>Hi <strong>${name}</strong>,</p>
              <p>We've received your message and will get back to you within 24 hours.</p>
              <p style="color:#8a8078;">— The Sarvoraa Team</p>
            </div>
          </div>`,
      });

      res.status(201).json({ success: true, message: 'Message received', id: msg._id });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── GET /api/contact  (admin only) ───────────────────────────────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const filter = unread === 'true' ? { read: false } : {};
    const skip   = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ContactMessage.countDocuments(filter),
    ]);

    res.json({ success: true, total, page: Number(page), messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/contact/:id/read  (admin only) ─────────────────────────────────
router.patch('/:id/read', protect, adminOnly, async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/contact/:id  (admin only) ─────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const msg = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
