const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  pay: { type: Number, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  shiftEndsAt: { type: Date, required: true },
  shiftStartsAt: { type: Date, required: true },
  category: { type: String, enum: ['Restaurant', 'Cafe', 'Wedding', 'Retail', 'Event', 'Other'], default: 'Other' },
  slotsTotal: { type: Number, required: true, default: 1 },
  slotsFilled: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'filling', 'full', 'completed', 'cancelled'], default: 'open' },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessName: { type: String, required: true },
  applicantsCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
