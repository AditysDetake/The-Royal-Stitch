const mongoose = require('mongoose');

const MeasurementSchema = new mongoose.Schema({
  customer_name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Customer phone is required'],
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  garment_type: {
    type: String,
    trim: true,
    default: 'Bespoke Suit' // e.g. Suit, Sherwani, Kurta Pajama, Shirt & Trouser, Tuxedo, Safari Suit
  },
  unit: {
    type: String,
    enum: ['inches', 'cm'],
    default: 'inches'
  },
  // ── Upper Body / Jacket / Shirt / Kurta ──
  chest: { type: String, trim: true, default: '' },
  waist: { type: String, trim: true, default: '' },
  hip: { type: String, trim: true, default: '' },
  shoulder: { type: String, trim: true, default: '' },
  sleeve_length: { type: String, trim: true, default: '' },
  neck_collar: { type: String, trim: true, default: '' },
  garment_length: { type: String, trim: true, default: '' },
  cross_back: { type: String, trim: true, default: '' },
  bicep: { type: String, trim: true, default: '' },
  wrist: { type: String, trim: true, default: '' },

  // ── Lower Body / Trousers / Pajama / Churidar ──
  trouser_waist: { type: String, trim: true, default: '' },
  trouser_hip: { type: String, trim: true, default: '' },
  trouser_length: { type: String, trim: true, default: '' },
  inseam: { type: String, trim: true, default: '' },
  thigh: { type: String, trim: true, default: '' },
  knee: { type: String, trim: true, default: '' },
  bottom_opening: { type: String, trim: true, default: '' },

  // ── Styling & Fitting Notes ──
  fit_preference: {
    type: String,
    enum: ['Slim Fit', 'Regular Fit', 'Comfort / Relaxed Fit', 'Traditional Bespoke'],
    default: 'Slim Fit'
  },
  notes: {
    type: String,
    trim: true,
    default: '' // special posture notes, fabric details, lapel style, etc.
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-update timestamp
MeasurementSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Frontend id virtual
MeasurementSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Measurement', MeasurementSchema);

