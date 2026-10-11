const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    index: true,
    default: ''
  },
  service: {
    type: String,
    required: [true, 'Service is required'],
    trim: true
  },
  date: {
    type: String, // Stored as YYYY-MM-DD
    required: [true, 'Date is required'],
    trim: true
  },
  time_slot: {
    type: String, // e.g. '10:00 AM'
    required: [true, 'Time slot is required'],
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    default: '' // customer notes
  },
  tailor_note: {
    type: String,
    trim: true,
    default: '' // tailor feedback or reason for acceptance/rejection
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending' // pending = Awaiting Tailor Review, confirmed = Accepted, cancelled = Rejected, completed = Done
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Map _id string to id for frontend API compatibility
AppointmentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
