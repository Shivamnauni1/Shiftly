const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'business'], required: true },

  // Common
  avatar: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },

  // Student fields
  college: { type: String, default: '' },
  skills: [String],
  shiftsCompleted: { type: Number, default: 0 },
  lastMinuteCancellations: { type: Number, default: 0 },
  missedShifts: { type: Number, default: 0 },

  // Business fields
  businessType: { type: String, default: '' },
  businessLocation: { type: String, default: '' },
  businessDescription: { type: String, default: '' },
  shiftsPosted: { type: Number, default: 0 },
  verified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
