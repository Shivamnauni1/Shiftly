const Job = require('../models/Job');
const User = require('../models/User');

const getJobs = async (req, res) => {
  try {
    const now = new Date();
    const { lat, lng, category, page = 1 } = req.query;
    const limit = 6;
    const skip = (page - 1) * limit;

    let query = {
      shiftEndsAt: { $gt: now },
      status: { $in: ['open', 'filling'] }
    };

    if (category && category !== 'All') query.category = category;

    let jobs = await Job.find(query).sort({ shiftStartsAt: 1 });

    // Filter by distance if coords provided (Haversine formula)
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      jobs = jobs.filter(job => {
        if (!job.lat || !job.lng) return true;
        const R = 6371;
        const dLat = (job.lat - userLat) * Math.PI / 180;
        const dLng = (job.lng - userLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(userLat * Math.PI/180) * Math.cos(job.lat * Math.PI/180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        job._doc.distance = Math.round(dist * 10) / 10;
        return dist <= 10;
      });
      jobs.sort((a, b) => (a._doc.distance || 99) - (b._doc.distance || 99));
    }

    const total = jobs.length;
    const paginated = jobs.slice(skip, skip + limit);

    res.json({ jobs: paginated, total, page: parseInt(page), hasMore: skip + limit < total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('business', 'name rating totalRatings businessType verified');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createJob = async (req, res) => {
  try {
    if (req.user.role !== 'business') return res.status(403).json({ message: 'Only businesses can post jobs' });

    const { title, description, location, lat, lng, pay, date, startTime, endTime, category, slotsTotal, businessName } = req.body;

    const shiftStartsAt = new Date(`${date}T${startTime}:00`);
    const shiftEndsAt = new Date(`${date}T${endTime}:00`);

    if (isNaN(shiftEndsAt)) return res.status(400).json({ message: 'Invalid date or time' });
    if (shiftEndsAt < new Date()) return res.status(400).json({ message: 'Shift cannot be in the past' });
    if (shiftEndsAt <= shiftStartsAt) return res.status(400).json({ message: 'End time must be after start time' });

    const job = await Job.create({
      title, description, location,
      lat: lat || null, lng: lng || null,
      pay, date, startTime, endTime,
      shiftStartsAt, shiftEndsAt,
      category: category || 'Other',
      slotsTotal: slotsTotal || 1,
      business: req.user.userId,
      businessName
    });

    await User.findByIdAndUpdate(req.user.userId, { $inc: { shiftsPosted: 1 } });
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.business.toString() !== req.user.userId) return res.status(403).json({ message: 'Not authorized' });
    await job.deleteOne();
    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ business: req.user.userId }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getJobs, getJob, createJob, deleteJob, getMyJobs };
