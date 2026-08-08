const express = require('express');
const Order          = require('../models/Order');
const ContactMessage = require('../models/ContactMessage');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/stats  (admin only) ─────────────────────────────────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      unreadMessages,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      ContactMessage.countDocuments({ read: false }),
      Order.find().sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        unreadMessages,
      },
      recentOrders,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
