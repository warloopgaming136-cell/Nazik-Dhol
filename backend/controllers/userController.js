const User = require('../models/User');

// @desc    Get all users (admin - manage users)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = { role: 'user' };
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.status(200).json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate / deactivate a user
// @route   PUT /api/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, message: 'User deleted.' });
  } catch (error) {
    next(error);
  }
};
