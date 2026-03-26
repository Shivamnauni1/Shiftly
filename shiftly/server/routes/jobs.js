const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getJobs, getJob, createJob, deleteJob, getMyJobs } = require('../controllers/jobController');

router.get('/', getJobs);
router.get('/mine', protect, getMyJobs);
router.get('/:id', getJob);
router.post('/', protect, createJob);
router.delete('/:id', protect, deleteJob);

module.exports = router;
