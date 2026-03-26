const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { applyJob, getApplications, getMyApplications, updateStatus, cancelApplication } = require('../controllers/applicationController');

// IMPORTANT: /mine must come before /:jobId to avoid route conflict
router.get('/mine', protect, getMyApplications);
router.get('/job/:jobId', protect, getApplications);
router.post('/:jobId', protect, applyJob);
router.put('/:id/status', protect, updateStatus);
router.put('/:id/cancel', protect, cancelApplication);

module.exports = router;
