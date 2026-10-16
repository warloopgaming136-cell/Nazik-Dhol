/* =========================================================
   NAZIK DHOL — dashboard.js (User Dashboard — clean layout)
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth('user');
  if (!user) return;

  bindTabs();
  renderProfileCard(user);
  bindProfileForm(user);
});

/* ─── Tab switching ─────────────────────────────────────── */
function switchTab(targetId) {
  // Default target is 'upcoming' bookings tab
  if (!targetId || targetId === 'events' || targetId === 'book') {
    targetId = 'upcoming';
  }

  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
  const target = document.getElementById(targetId);
  if (target) target.classList.add('active');

  document.querySelectorAll('.dashboard-tab.tab-link').forEach((a) => {
    const t = (a.getAttribute('href') || '').replace('#', '');
    a.classList.toggle('active', t === targetId);
  });

  if (targetId === 'upcoming') {
    loadMyBookings();
  }

  history.replaceState(null, '', '#' + targetId);
}

function bindTabs() {
  document.querySelectorAll('.dashboard-tab.tab-link[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(a.getAttribute('href').replace('#', ''));
    });
  });
  const hash = window.location.hash.replace('#', '');
  switchTab(hash || 'upcoming');
}

/* ─── Profile card & form ───────────────────────────────── */
function renderProfileCard(user) {
  const el = document.getElementById('profileCard');
  if (!el) return;
  el.innerHTML = `
    <div class="profile-avatar">${user.name.charAt(0).toUpperCase()}</div>
    <div>
      <h2 style="font-family:var(--font-heading);font-size:1.3rem;">${user.name}</h2>
      <p style="color:var(--muted);font-size:0.9rem;margin-top:6px;">
        <i class="fa-solid fa-envelope"></i> ${user.email}
        &nbsp;|&nbsp;
        <i class="fa-solid fa-phone"></i> ${user.phone}
      </p>
    </div>`;
  const pn = document.getElementById('profileName');
  const pp = document.getElementById('profilePhone');
  if (pn) pn.value = user.name;
  if (pp) pp.value = user.phone;
}

function bindProfileForm(user) {
  const form = document.getElementById('profileForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';
    try {
      const res = await api('/auth/me', {
        method: 'PUT',
        body: {
          name:  document.getElementById('profileName').value.trim(),
          phone: document.getElementById('profilePhone').value.trim(),
        },
      });
      const updated = { ...user, ...res.user };
      localStorage.setItem('nd_user', JSON.stringify(updated));
      toast('Profile updated!', 'success');
      renderProfileCard(updated);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Save Changes';
    }
  });
}

/* ─── My Bookings ───────────────────────────────────────── */
async function loadMyBookings() {
  const upEl  = document.getElementById('upcomingBookings');
  const histEl = document.getElementById('bookingHistory');

  if (upEl) upEl.innerHTML = renderSkeletonRows(6, 2);
  if (histEl) histEl.innerHTML = renderSkeletonRows(6, 3);

  try {
    const { bookings } = await api('/bookings/my');
    const now      = new Date();
    const upcoming = bookings.filter(
      (b) => new Date(b.eventDate) >= now && !['cancelled', 'rejected'].includes(b.status)
    );

    if (upEl)   upEl.innerHTML   = bookingRows(upcoming, true);
    if (histEl) histEl.innerHTML = bookingRows(bookings, false);

  } catch (err) {
    const errHtml = `<tr><td colspan="6" class="text-center" style="color:var(--danger);padding:30px;">Error: ${err.message}</td></tr>`;
    if (upEl) upEl.innerHTML = errHtml;
    if (histEl) histEl.innerHTML = errHtml;
  }
}

function renderSkeletonRows(cols, count) {
  let out = '';
  for (let r = 0; r < count; r++) {
    out += '<tr>';
    for (let c = 0; c < cols; c++) {
      out += '<td><div class="skeleton-bar" style="height:14px; width:70%; margin:0 auto;"></div></td>';
    }
    out += '</tr>';
  }
  return out;
}

function bookingRows(list, isUpcoming) {
  if (!list.length) {
    return `<tr><td colspan="6" class="text-center" style="color:var(--muted);padding:30px;">No events found.</td></tr>`;
  }

  return list.map((b) => {
    const dateStr = new Date(b.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + (b.eventTime || '');
    const badge = b.status === 'accepted' ? 'badge-status accepted' : b.status === 'rejected' || b.status === 'cancelled' ? 'badge-status rejected' : 'badge-status pending';
    
    // Status text format helper
    const statusText = b.status.charAt(0).toUpperCase() + b.status.slice(1);
    
    const cancelBtn = isUpcoming && b.status === 'pending'
      ? `<button class="btn btn-red btn-sm" onclick="cancelMyBooking('${b._id}')">Cancel</button>`
      : '-';

    return `
      <tr>
        <td style="font-family:monospace;font-weight:bold;color:var(--gold);">${b.bookingCode}</td>
        <td><strong>${b.eventType}</strong>${b.packageName ? `<br><span style="font-size:0.78rem;color:var(--muted);">${b.packageName}</span>` : ''}</td>
        <td>${dateStr}</td>
        <td>${b.venue}</td>
        <td><span class="${badge}">${statusText}</span></td>
        <td>${cancelBtn}</td>
      </tr>`;
  }).join('');
}

async function cancelMyBooking(id) {
  openConfirmModal(
    'Cancel Booking?',
    'Are you sure you want to cancel this booking request? This action cannot be undone.',
    async () => {
      try {
        await api(`/bookings/${id}/cancel`, { method: 'PUT' });
        toast('Booking cancelled successfully', 'success');
        loadMyBookings();
      } catch (err) {
        toast(err.message, 'error');
      }
    }
  );
}
window.cancelMyBooking = cancelMyBooking;
