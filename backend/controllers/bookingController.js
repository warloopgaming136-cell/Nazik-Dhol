const Booking = require('../models/Booking');
const AvailableDate = require('../models/AvailableDate');
const {
  sendBookingAccepted,
  sendBookingRejected,
  sendBookingReceived,
  sendAdminNewBookingAlert,
} = require('../utils/bookingNotifications');

// @desc    Create a new booking (works for guests and logged-in users)
// @route   POST /api/bookings
// @access  Public
exports.createBooking = async (req, res, next) => {
  try {
    const {
      customerName, phone, email, address, eventType,
      eventDate, eventTime, venue, package: packageId, packageName, specialRequirements,
    } = req.body;

    if (!customerName || !phone || !email || !address || !eventType || !eventDate || !eventTime || !venue) {
      return res.status(400).json({ success: false, message: 'Please fill in all required booking fields.' });
    }

    const booking = await Booking.create({
      user: req.user ? req.user.id : undefined,
      customerName, phone, email, address, eventType,
      eventDate, eventTime, venue,
      package: packageId || undefined,
      packageName,
      specialRequirements,
    });

    // Mark the calendar date as booked (best-effort, non-blocking)
    try {
      const dateOnly = new Date(new Date(eventDate).toDateString());
      await AvailableDate.findOneAndUpdate(
        { date: dateOnly },
        { date: dateOnly, status: 'booked', note: `Booking ${booking.bookingCode}` },
        { upsert: true }
      );
    } catch (e) {
      console.warn('Could not update available-dates calendar:', e.message);
    }

    // Send customer acknowledgment email (non-blocking / safe)
    sendBookingReceived(booking).catch((err) => {
      console.warn('Customer booking receipt email failed:', err.message);
    });

    // Send admin notification email to all admin accounts
    try {
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin', isActive: true }).select('email name');
      for (const admin of admins) {
        await sendAdminNewBookingAlert(booking, admin.email);
      }
      console.log(`Admin notification processed for booking ${booking.bookingCode}`);
    } catch (adminEmailErr) {
      console.warn('Admin notification email failed:', adminEmailErr.message);
    }

    res.status(201).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};


// @desc    Get logged-in user's bookings
// @route   GET /api/bookings/my
// @access  Private
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('package').sort('-createdAt');
    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking by id (or booking code lookup for guests)
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('package');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (req.user.role !== 'admin' && (!booking.user || booking.user.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking.' });
    }
    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel own booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (req.user.role !== 'admin' && (!booking.user || booking.user.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking.' });
    }

    if (['completed'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'A completed booking cannot be cancelled.' });
    }

    booking.status = 'cancelled';
    await booking.save();
    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// ---------- ADMIN ----------

// @desc    Get all bookings (with optional status/date filters + pagination)
// @route   GET /api/bookings
// @access  Private/Admin
exports.getAllBookings = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { customerName: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { bookingCode: new RegExp(search, 'i') },
      ];
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('package')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (accept / reject / completed)
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status, amount, note } = req.body;
    const allowed = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    if (amount !== undefined && amount !== null && amount !== '') {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a non-negative number.' });
      }
    }

    if (note !== undefined && note !== null && typeof note !== 'string') {
      return res.status(400).json({ success: false, message: 'Note must be a string.' });
    }

    const booking = await Booking.findById(req.params.id).populate('package');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const previousStatus = booking.status;

    // Idempotent check: if status is unchanged, do not resend email
    if (previousStatus === status) {
      let updated = false;
      if (amount !== undefined && amount !== null && amount !== '') {
        booking.amount = Number(amount);
        updated = true;
      }
      if (typeof note === 'string') {
        booking.statusNote = note.trim().slice(0, 500);
        updated = true;
      }
      if (updated) await booking.save();

      return res.status(200).json({
        success: true,
        booking,
        notification: booking.notification || null,
        statusUnchanged: true,
      });
    }

    booking.status = status;
    if (amount !== undefined && amount !== null && amount !== '') {
      booking.amount = Number(amount);
    }
    if (typeof note === 'string') {
      booking.statusNote = note.trim().slice(0, 500);
    }
    await booking.save();

    // Send customer email only on a real transition: pending -> accepted or pending -> rejected
    const isDecisionTransition =
      previousStatus === 'pending' && (status === 'accepted' || status === 'rejected');

    if (isDecisionTransition) {
      let emailResult;
      try {
        if (status === 'accepted') {
          emailResult = await sendBookingAccepted(booking);
        } else {
          emailResult = await sendBookingRejected(booking, booking.statusNote);
        }
      } catch (emailErr) {
        emailResult = {
          status: 'failed',
          sentAt: undefined,
          error: emailErr.message || 'Unexpected notification error.',
        };
      }

      booking.notification = {
        email: {
          status: emailResult.status,
          sentAt: emailResult.sentAt,
          error: emailResult.error,
        },
      };
      await booking.save();
    }

    res.status(200).json({
      success: true,
      booking,
      notification: booking.notification || null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend customer notification email for an accepted or rejected booking
// @route   POST /api/bookings/:id/resend-email
// @access  Private/Admin
exports.resendBookingEmail = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('package');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (!['accepted', 'rejected'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Notification email can only be sent for accepted or rejected bookings.',
      });
    }

    let emailResult;
    try {
      if (booking.status === 'accepted') {
        emailResult = await sendBookingAccepted(booking);
      } else {
        emailResult = await sendBookingRejected(booking, booking.statusNote);
      }
    } catch (emailErr) {
      emailResult = {
        status: 'failed',
        sentAt: undefined,
        error: emailErr.message || 'Unexpected notification error.',
      };
    }

    booking.notification = {
      email: {
        status: emailResult.status,
        sentAt: emailResult.sentAt,
        error: emailResult.error,
      },
    };
    await booking.save();

    res.status(200).json({
      success: true,
      booking,
      notification: booking.notification,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dashboard stats overview
// @route   GET /api/bookings/stats/overview
// @access  Private/Admin
exports.getBookingStats = async (req, res, next) => {
  try {
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

    const [totalBookings, todaysBookings, revenueAgg, statusCounts] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      Booking.aggregate([
        { $match: { status: { $in: ['accepted', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const User = require('../models/User');
    const totalCustomers = await User.countDocuments({ role: 'user' });

    res.status(200).json({
      success: true,
      stats: {
        totalBookings,
        todaysBookings,
        revenue: revenueAgg[0] ? revenueAgg[0].total : 0,
        totalCustomers,
        statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      },
    });
  } catch (error) {
    next(error);
  }
};
