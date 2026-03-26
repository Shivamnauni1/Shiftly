const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { submitRating } = require('../controllers/ratingController');

router.post('/', protect, submitRating);

module.exports = router;
