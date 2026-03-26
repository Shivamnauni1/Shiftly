const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled', 'missed'], default: 'pending' },
  cancelledAt: { type: Date, default: null },
  isLastMinute: { type: Boolean, default: false },
  studentRatedBusiness: { type: Boolean, default: false },
  businessRatedStudent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
