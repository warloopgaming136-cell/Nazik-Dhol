const sendEmail = require('./sendEmail');

/**
 * Escapes user-provided strings before interpolating into HTML email templates.
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getClientUrl() {
  return (process.env.CLIENT_URL || 'http://localhost:5000').replace(/\/$/, '');
}

function getAdminSenderEmail() {
  const user = (process.env.SMTP_USER || '').trim();
  if (user && user !== 'your_email@gmail.com') return user;
  return 'doluboluzenox@gmail.com';
}

function getWhatsAppDetails() {
  const raw = (process.env.WHATSAPP_NUMBER || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const display =
    digits.length === 12 && digits.startsWith('91')
      ? `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
      : `+${digits}`;
  return { digits, display };
}

function resolvePackageLabel(booking) {
  if (booking.packageName) return booking.packageName;
  if (booking.package && typeof booking.package === 'object' && booking.package.name) {
    return booking.package.name;
  }
  return 'Standard / Custom';
}

function formatEventDate(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  return Number.isNaN(d.getTime()) ? String(dateVal) : d.toDateString();
}

function toNotificationResult(res) {
  if (res && res.success) {
    return {
      success: true,
      status: 'sent',
      sentAt: new Date(),
      error: null,
    };
  }
  if (res && res.skipped) {
    return {
      success: false,
      status: 'skipped',
      sentAt: undefined,
      error: res.error || 'SMTP credentials are not configured.',
    };
  }
  return {
    success: false,
    status: 'failed',
    sentAt: undefined,
    error: (res && res.error) || 'Failed to send email.',
  };
}

/**
 * Sends a branded confirmation email to the customer when their booking is ACCEPTED.
 */
async function sendBookingAccepted(booking) {
  const clientUrl = getClientUrl();
  const adminEmail = escapeHtml(getAdminSenderEmail());
  const wa = getWhatsAppDetails();
  const code = escapeHtml(booking.bookingCode);
  const customerName = escapeHtml(booking.customerName);
  const eventType = escapeHtml(booking.eventType);
  const eventDate = escapeHtml(formatEventDate(booking.eventDate));
  const eventTime = escapeHtml(booking.eventTime);
  const venue = escapeHtml(booking.venue);
  const packageLabel = escapeHtml(resolvePackageLabel(booking));
  const hasAmount = booking.amount !== undefined && booking.amount !== null && Number(booking.amount) > 0;
  const formattedAmount = hasAmount ? `\u20B9${Number(booking.amount).toLocaleString('en-IN')}` : null;

  const waText = encodeURIComponent(
    `Hi Nazik Dhol! My booking ${booking.bookingCode || ''} for ${booking.eventType || 'my event'} on ${formatEventDate(booking.eventDate)} has been confirmed.`
  );

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0705;color:#f4ead9;padding:30px;border-radius:12px;border:1px solid #d4af37;">
      <h2 style="color:#d4af37;margin-top:0;margin-bottom:8px;">🥁 Booking Confirmed!</h2>
      <p style="color:#f4ead9;font-size:15px;line-height:1.6;margin-bottom:20px;">
        Dear <strong>${customerName}</strong>,<br>
        Great news! Your booking request with <strong>Nazik Dhol</strong> has been <strong>accepted</strong>. Our troupe is locked in and ready to bring high-energy festival beats to your celebration.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;width:40%;">Booking Code</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);font-weight:bold;color:#f3d576;">${code}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Event Type</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#f4ead9;">${eventType}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Date &amp; Time</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#f4ead9;">${eventDate} at ${eventTime}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Venue</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#f4ead9;">${venue}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Package</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#f4ead9;">${packageLabel}</td>
        </tr>
        ${
          formattedAmount
            ? `<tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Confirmed Amount</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);font-weight:bold;color:#f3d576;">${escapeHtml(formattedAmount)}</td>
        </tr>`
            : ''
        }
      </table>

      <div style="background:rgba(212,175,55,0.08);border-left:3px solid #d4af37;padding:14px 16px;border-radius:6px;margin-bottom:24px;">
        <h4 style="color:#f3d576;margin:0 0 8px 0;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;">Next Steps</h4>
        <ul style="margin:0;padding-left:18px;color:#c2b295;font-size:14px;line-height:1.6;">
          <li>Our event coordinator will reach out before your event date to finalize entry timing, uniform theme, and choreography cues.</li>
          <li>Please keep your Booking Code (<strong>${code}</strong>) handy for any inquiries.</li>
          <li>Coordinator Email: <a href="mailto:${adminEmail}" style="color:#f3d576;text-decoration:none;"><strong>${adminEmail}</strong></a></li>
          ${wa ? `<li>For immediate coordination or special requests, reach us anytime on WhatsApp at <strong>${escapeHtml(wa.display)}</strong>.</li>` : ''}
        </ul>
      </div>

      <div style="margin-top:24px;text-align:center;">
        ${
          wa
            ? `<a href="https://wa.me/${escapeHtml(wa.digits)}?text=${waText}" style="background:#25D366;color:#0a0705;padding:12px 24px;border-radius:999px;font-weight:bold;text-decoration:none;display:inline-block;margin:6px;">Chat on WhatsApp</a>`
            : ''
        }
        <a href="${escapeHtml(clientUrl)}/dashboard.html" style="background:linear-gradient(135deg,#f3d576,#d4af37);color:#221806;padding:12px 24px;border-radius:999px;font-weight:bold;text-decoration:none;display:inline-block;margin:6px;">View My Booking &rarr;</a>
      </div>

      <p style="color:#8a7a5f;font-size:12px;margin-top:26px;text-align:center;">
        Nazik Dhol &mdash; Official Coordinator: ${adminEmail}
      </p>
    </div>
  `;

  const res = await sendEmail({
    to: booking.email,
    subject: `Nazik Dhol - Booking Confirmed (${booking.bookingCode})`,
    html,
  });

  return toNotificationResult(res);
}

/**
 * Sends a polite, branded email to the customer when their booking is REJECTED.
 */
async function sendBookingRejected(booking, reason = '') {
  const clientUrl = getClientUrl();
  const adminEmail = escapeHtml(getAdminSenderEmail());
  const wa = getWhatsAppDetails();
  const code = escapeHtml(booking.bookingCode);
  const customerName = escapeHtml(booking.customerName);
  const eventType = escapeHtml(booking.eventType);
  const eventDate = escapeHtml(formatEventDate(booking.eventDate));
  const eventTime = escapeHtml(booking.eventTime);
  const venue = escapeHtml(booking.venue);
  const cleanReason = escapeHtml((reason || booking.statusNote || '').trim());

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0705;color:#f4ead9;padding:30px;border-radius:12px;border:1px solid #d4af37;">
      <h2 style="color:#d4af37;margin-top:0;margin-bottom:8px;">Update on Your Booking Request (${code})</h2>
      <p style="color:#f4ead9;font-size:15px;line-height:1.6;margin-bottom:18px;">
        Dear <strong>${customerName}</strong>,<br>
        Thank you sincerely for considering <strong>Nazik Dhol</strong> for your upcoming <strong>${eventType}</strong>. Unfortunately, our troupe is unable to accommodate the requested schedule slot below.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;width:40%;">Booking Code</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);font-weight:bold;color:#f3d576;">${code}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Requested Slot</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#f4ead9;">${eventDate} at ${eventTime}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Venue</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#f4ead9;">${venue}</td>
        </tr>
      </table>

      ${
        cleanReason
          ? `<div style="background:rgba(212,175,55,0.08);border-left:3px solid #d4af37;padding:12px 16px;border-radius:6px;margin-bottom:20px;">
        <strong style="color:#f3d576;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Note from our coordinator:</strong>
        <p style="color:#f4ead9;margin:6px 0 0 0;font-size:14px;line-height:1.5;">${cleanReason}</p>
      </div>`
          : ''
      }

      <p style="color:#c2b295;font-size:14px;line-height:1.6;margin-bottom:24px;">
        We would still love to perform for you if your schedule is flexible! You can view our open dates and submit a new request for another date or time using the link below, email us at <a href="mailto:${adminEmail}" style="color:#f3d576;text-decoration:none;"><strong>${adminEmail}</strong></a>${wa ? `, or message us on WhatsApp at <strong>${escapeHtml(wa.display)}</strong>` : ''}.
      </p>

      <div style="margin-top:24px;text-align:center;">
        <a href="${escapeHtml(clientUrl)}/booking.html" style="background:linear-gradient(135deg,#f3d576,#d4af37);color:#221806;padding:14px 28px;border-radius:999px;font-weight:bold;text-decoration:none;display:inline-block;">Choose Another Date &rarr;</a>
      </div>

      <p style="color:#8a7a5f;font-size:12px;margin-top:26px;text-align:center;">
        Nazik Dhol &mdash; Official Coordinator: ${adminEmail}
      </p>
    </div>
  `;

  const res = await sendEmail({
    to: booking.email,
    subject: `Nazik Dhol - Update on Booking Request (${booking.bookingCode})`,
    html,
  });

  return toNotificationResult(res);
}

/**
 * Sends initial acknowledgment email to the customer when a booking is first submitted.
 */
async function sendBookingReceived(booking) {
  const code = escapeHtml(booking.bookingCode);
  const customerName = escapeHtml(booking.customerName);
  const eventType = escapeHtml(booking.eventType);
  const eventDate = escapeHtml(formatEventDate(booking.eventDate));
  const eventTime = escapeHtml(booking.eventTime);
  const venue = escapeHtml(booking.venue);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0705;color:#f4ead9;padding:30px;border-radius:12px;border:1px solid #d4af37;">
      <h2 style="color:#d4af37;margin-top:0;margin-bottom:8px;">Thank you, ${customerName}!</h2>
      <p style="color:#c2b295;line-height:1.6;">We have received your booking request. Our team will review availability and confirm shortly.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr><td style="padding:8px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;width:40%;">Booking Code</td><td style="padding:8px 0;border-bottom:1px solid rgba(212,175,55,0.2);font-weight:bold;color:#f3d576;">${code}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Event</td><td style="padding:8px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#f4ead9;">${eventType} on ${eventDate} at ${eventTime}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Venue</td><td style="padding:8px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#f4ead9;">${venue}</td></tr>
      </table>
    </div>
  `;

  return sendEmail({
    to: booking.email,
    subject: `Nazik Dhol - Booking Received (${booking.bookingCode})`,
    html,
  });
}

/**
 * Sends new booking alert email to an admin address with escaped fields and CLIENT_URL link.
 */
async function sendAdminNewBookingAlert(booking, adminEmail) {
  const clientUrl = getClientUrl();
  const code = escapeHtml(booking.bookingCode);
  const customerName = escapeHtml(booking.customerName);
  const phone = escapeHtml(booking.phone);
  const email = escapeHtml(booking.email);
  const eventType = escapeHtml(booking.eventType);
  const packageName = escapeHtml(booking.packageName || 'None');
  const eventDate = escapeHtml(formatEventDate(booking.eventDate));
  const eventTime = escapeHtml(booking.eventTime);
  const venue = escapeHtml(booking.venue);
  const address = escapeHtml(booking.address);
  const specialRequirements = escapeHtml(booking.specialRequirements);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0705;color:#f4ead9;padding:30px;border-radius:12px;border:1px solid #d4af37;">
      <h2 style="color:#d4af37;margin-bottom:6px;">🥁 New Booking Received</h2>
      <p style="color:#c2b295;margin-bottom:24px;">A new booking has just been submitted on Nazik Dhol.</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;width:40%;">Booking Code</td><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);font-weight:bold;color:#f3d576;">${code}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Customer Name</td><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);">${customerName}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Phone</td><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);">${phone}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Email</td><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);">${email}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Event Type</td><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);">${eventType}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Package</td><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);">${packageName}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Event Date</td><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);">${eventDate} at ${eventTime}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Venue</td><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);">${venue}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);color:#c2b295;">Address</td><td style="padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.2);">${address}</td></tr>
        ${specialRequirements ? `<tr><td style="padding:10px 0;color:#c2b295;">Special Requirements</td><td style="padding:10px 0;">${specialRequirements}</td></tr>` : ''}
      </table>
      <div style="margin-top:28px;text-align:center;">
        <a href="${escapeHtml(clientUrl)}/admin-dashboard.html" style="background:linear-gradient(135deg,#f3d576,#d4af37);color:#221806;padding:14px 28px;border-radius:999px;font-weight:bold;text-decoration:none;display:inline-block;">Open Admin Dashboard &rarr;</a>
      </div>
      <p style="color:#8a7a5f;font-size:12px;margin-top:24px;text-align:center;">Nazik Dhol Admin Notification &mdash; Do not reply to this email.</p>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `🔔 New Booking Alert - ${booking.bookingCode} | Nazik Dhol`,
    html,
  });
}

module.exports = {
  escapeHtml,
  sendBookingAccepted,
  sendBookingRejected,
  sendBookingReceived,
  sendAdminNewBookingAlert,
};
