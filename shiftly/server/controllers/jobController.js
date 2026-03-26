const Job = require('../models/Job');

// Get all jobs
const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single job
const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Post a job (business only)
const createJob = async (req, res) => {
  try {
    if (req.user.role !== 'business') {
      return res.status(403).json({ message: 'Only businesses can post jobs' });
    }
    const { title, description, location, pay, hours } = req.body;
    const job = await Job.create({
      title, description, location, pay, hours,
      business: req.user.userId,
      businessName: req.body.businessName
    });
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a job
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.business.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await job.deleteOne();
    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get jobs posted by logged-in business
const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ business: req.user.userId }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getJobs, getJob, createJob, deleteJob, getMyJobs };
