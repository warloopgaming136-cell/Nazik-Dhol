const nodemailer = require('nodemailer');

let cachedTestAccount = null;

async function getFallbackTransporter() {
  try {
    if (!cachedTestAccount) {
      cachedTestAccount = await nodemailer.createTestAccount();
    }
    return nodemailer.createTransport({
      host: cachedTestAccount.smtp.host,
      port: cachedTestAccount.smtp.port,
      secure: cachedTestAccount.smtp.secure,
      auth: {
        user: cachedTestAccount.user,
        pass: cachedTestAccount.pass,
      },
    });
  } catch (err) {
    // Offline fallback: use Nodemailer's built-in JSON transport
    return nodemailer.createTransport({ jsonTransport: true });
  }
}

// Sends an email using SMTP credentials from .env, with automatic fallback
// transport when SMTP_PASS is not yet configured.
// Never throws — returns { success, skipped, error } so callers can record status safely.
const sendEmail = async ({ to, subject, html }) => {
  try {
    require('dotenv').config({ override: true });
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const user = process.env.SMTP_USER || 'doluboluzenox@gmail.com';
    const pass = process.env.SMTP_PASS;

    const isPlaceholder =
      !host ||
      !user ||
      !pass ||
      user === 'your_email@gmail.com' ||
      pass === 'your_app_password';

    let transporter;
    if (!isPlaceholder) {
      const port = Number(process.env.SMTP_PORT) || 587;
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass: pass.replace(/\s+/g, '') },
      });
    } else {
      transporter = await getFallbackTransporter();
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Nazik Dhol" <${user}>`,
      replyTo: user,
      to,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
    if (previewUrl) {
      console.log(`Email sent to ${to} (Preview: ${previewUrl})`);
    } else {
      console.log('Email sent to', to);
    }

    return { success: true, skipped: false, error: null, previewUrl: previewUrl || null };
  } catch (error) {
    console.error('Email send failed:', error.message);
    return {
      success: false,
      skipped: false,
      error: error.message || 'Unknown email transport error.',
    };
  }
};

module.exports = sendEmail;


