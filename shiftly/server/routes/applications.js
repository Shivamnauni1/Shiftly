const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { applyJob, getApplications, getMyApplications, updateStatus } = require('../controllers/applicationController');

router.post('/:jobId', protect, applyJob);
router.get('/job/:jobId', protect, getApplications);
router.get('/mine', protect, getMyApplications);
router.put('/:id', protect, updateStatus);

module.exports = router;
