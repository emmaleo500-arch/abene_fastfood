const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    id:       { type: String, required: true },
    name:     { type: String, required: true },
    price:    { type: Number, required: true },
    qty:      { type: Number, required: true, min: 1 },
    image:    { type: String, default: '' },
    category: { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Customer details
    customerName:    { type: String, required: true, trim: true },
    customerPhone:   { type: String, required: true, trim: true },
    deliveryAddress: { type: String, required: true, trim: true },

    // Cart snapshot
    items:        { type: [orderItemSchema], required: true },
    subtotal:     { type: Number, required: true },
    deliveryFee:  { type: Number, default: 2000 },
    total:        { type: Number, required: true },

    // Lifecycle
    status: {
      type:    String,
      enum:    ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },

    // Optional note from customer
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

// Virtual for a quick human-readable order number
orderSchema.virtual('orderNumber').get(function () {
  return `ORD-${this._id.toString().slice(-6).toUpperCase()}`;
});

orderSchema.set('toJSON',   { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
