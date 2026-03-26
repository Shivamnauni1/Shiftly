const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ratedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, default: '' },
  type: { type: String, enum: ['student-to-business', 'business-to-student'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Rating', ratingSchema);
