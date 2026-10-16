const express = require('express');
const router = express.Router();
const sendEmail = require('../utils/sendEmail');

// @desc    Handle contact form submissions
// @route   POST /api/contact
// @access  Public
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required.' });
    }

    await sendEmail({
      to: process.env.SMTP_USER,
      subject: `Nazik Dhol - New Contact Message from ${name}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone || 'N/A'}</p><p><strong>Message:</strong><br/>${message}</p>`,
    });

    res.status(200).json({ success: true, message: 'Thank you for reaching out! We will get back to you soon.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
