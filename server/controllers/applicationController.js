const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

// Apply for a job
const applyJob = async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can apply' });

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (['full', 'completed', 'cancelled'].includes(job.status)) {
      return res.status(400).json({ message: 'This shift is no longer accepting applications' });
    }

    const existing = await Application.findOne({ job: req.params.jobId, student: req.user.userId });
    if (existing && existing.status !== 'cancelled') {
      return res.status(400).json({ message: 'You already applied to this shift' });
    }

    const user = await User.findById(req.user.userId);
    const application = await Application.create({
      job: req.params.jobId,
      student: req.user.userId,
      studentName: user.name
    });

    await Job.findByIdAndUpdate(req.params.jobId, { $inc: { applicantsCount: 1 } });
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get applications for a specific job
const getApplications = async (req, res) => {
  try {
    const apps = await Application.find({ job: req.params.jobId })
      .populate('student', 'name email college skills rating totalRatings shiftsCompleted missedShifts lastMinuteCancellations');
    res.json(apps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get logged-in student's own applications
const getMyApplications = async (req, res) => {
  try {
    const apps = await Application.find({ student: req.user.userId })
      .populate('job')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept or reject (business)
const updateStatus = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const { status } = req.body;
    const job = application.job;

    if (status === 'accepted') {
      if (job.slotsFilled >= job.slotsTotal) {
        return res.status(400).json({ message: 'All slots are already filled' });
      }
      application.status = 'accepted';
      const newFilled = job.slotsFilled + 1;
      const newStatus = newFilled >= job.slotsTotal ? 'full' : 'filling';
      await Job.findByIdAndUpdate(job._id, { slotsFilled: newFilled, status: newStatus });
    } else {
      application.status = status;
    }

    await application.save();
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel application (student) — FIX: check status before changing it
const cancelApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.student.toString() !== req.user.userId) return res.status(403).json({ message: 'Not authorized' });
    if (application.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

    const job = application.job;
    const now = new Date();
    const shiftStart = new Date(job.shiftStartsAt);
    const hoursUntilShift = (shiftStart - now) / (1000 * 60 * 60);

    // Check BEFORE changing status whether they were accepted
    const wasAccepted = application.status === 'accepted';
    // Last minute = accepted and cancelling within 1 hour of start
    const isLastMinute = wasAccepted && hoursUntilShift < 1;

    // Now update status
    application.status = 'cancelled';
    application.cancelledAt = now;
    application.isLastMinute = isLastMinute;
    await application.save();

    // Reopen slot if they were accepted
    if (wasAccepted) {
      const newFilled = Math.max(0, job.slotsFilled - 1);
      const newStatus = newFilled === 0 ? 'open' : 'filling';
      await Job.findByIdAndUpdate(job._id, { slotsFilled: newFilled, status: newStatus });
    }

    // Track last minute cancellation on profile
    if (isLastMinute) {
      await User.findByIdAndUpdate(req.user.userId, { $inc: { lastMinuteCancellations: 1 } });
    }

    res.json({ message: 'Cancelled successfully', isLastMinute });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark no-shows — called by the midnight job
const markNoShows = async () => {
  try {
    const now = new Date();
    // Find all accepted applications where shift has ended and not yet marked
    const apps = await Application.find({ status: 'accepted' }).populate('job');
    for (const app of apps) {
      if (app.job && new Date(app.job.shiftEndsAt) < now) {
        app.status = 'missed';
        await app.save();
        await User.findByIdAndUpdate(app.student, { $inc: { missedShifts: 1 } });
      }
    }
    console.log('No-show check complete');
  } catch (err) {
    console.error('No-show check failed:', err.message);
  }
};

// Mark completed shifts for students
const markCompletedShifts = async () => {
  try {
    const now = new Date();
    const apps = await Application.find({ status: 'accepted' }).populate('job');
    for (const app of apps) {
      if (app.job && new Date(app.job.shiftEndsAt) < now) {
        await User.findByIdAndUpdate(app.student, { $inc: { shiftsCompleted: 1 } });
        app.status = 'completed';
        await app.save();
      }
    }
  } catch (err) {
    console.error('Mark completed failed:', err.message);
  }
};

module.exports = { applyJob, getApplications, getMyApplications, updateStatus, cancelApplication, markNoShows, markCompletedShifts };
