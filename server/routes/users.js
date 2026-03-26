const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { getProfile, updateProfile, getMe } = require('../controllers/userController');

router.get('/me', protect, getMe);
router.get('/:id', getProfile);
router.put('/me', protect, updateProfile);

module.exports = router;
