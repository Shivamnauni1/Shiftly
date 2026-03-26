const User = require('../models/User');
const Rating = require('../models/Rating');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const reviews = await Rating.find({ ratedUser: req.params.id })
      .populate('ratedBy', 'name businessName')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ user, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { college, skills, businessType, businessLocation, businessDescription, name } = req.body;
    const update = {};
    if (name) update.name = name;
    if (college) update.college = college;
    if (skills) update.skills = skills;
    if (businessType) update.businessType = businessType;
    if (businessLocation) update.businessLocation = businessLocation;
    if (businessDescription) update.businessDescription = businessDescription;

    const user = await User.findByIdAndUpdate(req.user.userId, update, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile, getMe };
