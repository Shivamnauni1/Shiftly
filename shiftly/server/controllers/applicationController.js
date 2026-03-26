const Application = require('../models/Application');

// Apply for a job (student only)
const applyJob = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can apply' });
    }
    const existing = await Application.findOne({ job: req.params.jobId, student: req.user.userId });
    if (existing) return res.status(400).json({ message: 'Already applied' });

    const application = await Application.create({
      job: req.params.jobId,
      student: req.user.userId,
      studentName: req.body.studentName
    });
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get applications for a job (business only)
const getApplications = async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId }).populate('student', 'name email');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student's own applications
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ student: req.user.userId }).populate('job');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept or reject application (business only)
const updateStatus = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    application.status = req.body.status;
    await application.save();
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { applyJob, getApplications, getMyApplications, updateStatus };
