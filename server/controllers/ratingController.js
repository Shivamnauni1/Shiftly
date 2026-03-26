const Rating = require('../models/Rating');
const Application = require('../models/Application');
const User = require('../models/User');

const submitRating = async (req, res) => {
  try {
    const { applicationId, rating, review, type } = req.body;

    const application = await Application.findById(applicationId).populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.status !== 'accepted') return res.status(400).json({ message: 'Can only rate completed shifts' });

    const job = application.job;
    if (new Date() < new Date(job.shiftEndsAt)) return res.status(400).json({ message: 'Shift has not ended yet' });

    let ratedUser;
    if (type === 'student-to-business') {
      if (application.studentRatedBusiness) return res.status(400).json({ message: 'Already rated' });
      ratedUser = job.business;
      await Application.findByIdAndUpdate(applicationId, { studentRatedBusiness: true });
    } else {
      if (application.businessRatedStudent) return res.status(400).json({ message: 'Already rated' });
      ratedUser = application.student;
      await Application.findByIdAndUpdate(applicationId, { businessRatedStudent: true });
    }

    await Rating.create({
      job: job._id, application: applicationId,
      ratedBy: req.user.userId, ratedUser,
      rating, review, type
    });

    // Recalculate average rating
    const allRatings = await Rating.find({ ratedUser });
    const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
    await User.findByIdAndUpdate(ratedUser, {
      rating: Math.round(avg * 10) / 10,
      totalRatings: allRatings.length
    });

    res.json({ message: 'Rating submitted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitRating };
