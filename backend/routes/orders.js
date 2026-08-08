const express = require('express');
const { body, param, validationResult } = require('express-validator');

const Order    = require('../models/Order');
const sendMail = require('../config/mailer');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => `₵${Number(n).toLocaleString('en-GH')}`;

const orderEmailHtml = (order) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1e1b18;color:#f0ece6;border-radius:16px;overflow:hidden;">
  <div style="background:#d4a373;padding:20px 24px;">
    <h1 style="margin:0;color:#121212;font-size:1.3rem;">🛒 New Order — ${order.orderNumber}</h1>
  </div>
  <div style="padding:24px;">
    <table style="width:100%;border-collapse:collapse;font-size:.9rem;">
      <tr><td style="color:#8a8078;padding:4px 0;">Customer</td><td style="font-weight:700;">${order.customerName}</td></tr>
      <tr><td style="color:#8a8078;padding:4px 0;">Phone</td><td>${order.customerPhone}</td></tr>
      <tr><td style="color:#8a8078;padding:4px 0;">Address</td><td>${order.deliveryAddress}</td></tr>
      <tr><td style="color:#8a8078;padding:4px 0;">Note</td><td>${order.note || '—'}</td></tr>
    </table>
    <hr style="border-color:#3d3630;margin:16px 0;">
    <h3 style="color:#d4a373;margin-bottom:10px;">Items</h3>
    ${order.items.map(i => `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #3d3630;">
        <span>${i.name} × ${i.qty}</span>
        <span style="color:#d4a373;font-weight:700;">${fmt(i.price * i.qty)}</span>
      </div>`).join('')}
    <div style="text-align:right;margin-top:12px;font-size:1rem;">
      <span style="color:#8a8078;">Subtotal:</span> ${fmt(order.subtotal)}<br>
      <span style="color:#8a8078;">Delivery:</span> ${fmt(order.deliveryFee)}<br>
      <strong style="color:#d4a373;font-size:1.1rem;">Total: ${fmt(order.total)}</strong>
    </div>
    <div style="margin-top:16px;padding:12px;background:#2a2824;border-radius:8px;">
      <a href="${process.env.CLIENT_ORIGIN || ''}/backend/admin/index.html"
         style="color:#d4a373;font-weight:700;">View in Admin Dashboard →</a>
    </div>
  </div>
</div>`;

// ── POST /api/orders  (public — customers place orders) ──────────────────────
router.post(
  '/',
  [
    body('customerName').notEmpty().withMessage('Name is required'),
    body('customerPhone').notEmpty().withMessage('Phone is required'),
    body('deliveryAddress').notEmpty().withMessage('Address is required'),
    body('items').isArray({ min: 1 }).withMessage('Cart cannot be empty'),
    body('items.*.id').notEmpty(),
    body('items.*.name').notEmpty(),
    body('items.*.price').isNumeric(),
    body('items.*.qty').isInt({ min: 1 }),
    body('subtotal').isNumeric(),
    body('total').isNumeric(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const order = await Order.create(req.body);

      // Notify admin by email (fire and forget)
      sendMail({
        to:      process.env.ADMIN_NOTIFY_EMAIL,
        subject: `🛒 New Order ${order.orderNumber} from ${order.customerName}`,
        html:    orderEmailHtml(order),
      });

      res.status(201).json({ success: true, order });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── GET /api/orders  (admin only) ─────────────────────────────────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const skip   = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    res.json({ success: true, total, page: Number(page), orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/orders/:id  (admin only) ─────────────────────────────────────────
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/orders/:id/status  (admin only) ────────────────────────────────
router.patch(
  '/:id/status',
  protect,
  adminOnly,
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('status')
      .isIn(['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'])
      .withMessage('Invalid status'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    try {
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true, runValidators: true }
      );
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      res.json({ success: true, order });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── DELETE /api/orders/:id  (admin only) ──────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
