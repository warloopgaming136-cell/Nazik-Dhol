const AvailableDate = require('../models/AvailableDate');

// @desc    Get calendar entries (optionally filtered by month/year)
// @route   GET /api/dates?month=7&year=2026
// @access  Public
exports.getDates = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.month && req.query.year) {
      const start = new Date(req.query.year, req.query.month - 1, 1);
      const end = new Date(req.query.year, req.query.month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }
    const dates = await AvailableDate.find(query).sort('date');
    res.status(200).json({ success: true, count: dates.length, data: dates });
  } catch (error) {
    next(error);
  }
};

// @desc    Set/update a date's status (admin marks holiday, blocks a date, etc.)
// @route   POST /api/dates
// @access  Private/Admin
exports.setDate = async (req, res, next) => {
  try {
    const { date, status, note } = req.body;
    if (!date || !status) {
      return res.status(400).json({ success: false, message: 'Date and status are required.' });
    }
    const dateOnly = new Date(new Date(date).toDateString());
    const entry = await AvailableDate.findOneAndUpdate(
      { date: dateOnly },
      { date: dateOnly, status, note },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a date entry (resets it back to default available)
// @route   DELETE /api/dates/:id
// @access  Private/Admin
exports.deleteDate = async (req, res, next) => {
  try {
    await AvailableDate.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Date entry removed.' });
  } catch (error) {
    next(error);
  }
};
