/* =========================================================
   NAZIK DHOL — admin.js (Admin Dashboard)
   Tab-based single page admin panel driven by a small config
   object per content collection to avoid repeating CRUD code.
   ========================================================= */

let ADMIN = null;
let currentBookingsPage = 1;

const RESOURCE_CONFIG = {
  services: {
    endpoint: '/services',
    title: 'Services',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'startingPrice', label: 'Price', render: (v) => `\u20B9${v}` },
      { key: 'duration', label: 'Duration' },
      { key: 'isActive', label: 'Active', render: (v) => (v ? 'Yes' : 'No') },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'Slug (unique, e.g. dj-night)', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'startingPrice', label: 'Starting Price (₹)', type: 'number', required: true },
      { name: 'duration', label: 'Duration', type: 'text', required: true },
      { name: 'icon', label: 'FontAwesome Icon (e.g. fa-drum)', type: 'text' },
      { name: 'image', label: 'Image', type: 'file' },
      { name: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
  packages: {
    endpoint: '/packages',
    title: 'Packages',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'price', label: 'Price', render: (v) => `\u20B9${v}` },
      { key: 'numberOfMembers', label: 'Members' },
      { key: 'isPopular', label: 'Popular', render: (v) => (v ? 'Yes' : 'No') },
    ],
    fields: [
      { name: 'name', label: 'Package Name', type: 'select', options: ['Basic Package', 'Standard Package', 'Premium Package', 'Royal Package', 'VIP Package'], required: true },
      { name: 'price', label: 'Price (₹)', type: 'number', required: true },
      { name: 'numberOfMembers', label: 'Number of Members', type: 'number', required: true },
      { name: 'duration', label: 'Duration', type: 'text', required: true },
      { name: 'features', label: 'Features (comma separated)', type: 'textarea', list: true },
      { name: 'instrumentsIncluded', label: 'Instruments (comma separated)', type: 'text', list: true },
      { name: 'isPopular', label: 'Mark as Popular', type: 'checkbox' },
      { name: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
  team: {
    endpoint: '/team',
    title: 'Team',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'experience', label: 'Experience' },
      { key: 'phone', label: 'Phone' },
    ],
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'text', required: true },
      { name: 'experience', label: 'Experience (e.g. 8+ years)', type: 'text', required: true },
      { name: 'phone', label: 'Phone', type: 'text', required: true },
      { name: 'bio', label: 'Short Bio', type: 'textarea' },
      { name: 'displayOrder', label: 'Display Order', type: 'number' },
      { name: 'photo', label: 'Photo', type: 'file' },
      { name: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
  gallery: {
    endpoint: '/gallery',
    title: 'Gallery',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'isActive', label: 'Active', render: (v) => (v ? 'Yes' : 'No') },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['Wedding', 'Temple', 'Festival', 'Reception', 'Corporate'], required: true },
      { name: 'image', label: 'Image', type: 'file', required: true },
      { name: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
  videos: {
    endpoint: '/videos',
    title: 'Videos',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'youtubeId', label: 'YouTube ID' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'youtubeId', label: 'YouTube Video ID', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'isActive', label: 'Active', type: 'checkbox' },
    ],
  },
};

document.addEventListener('DOMContentLoaded', async () => {
  ADMIN = requireAuth('admin');
  if (!ADMIN) return;

  const nameEl = document.getElementById('adminName');
  if (nameEl) nameEl.textContent = ADMIN.name;

  bindTabs();
  await loadStats();
  await loadBookings();

  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) sidebarToggle.addEventListener('click', () => document.querySelector('.dash-sidebar').classList.toggle('open'));

  const bookingSearch = document.getElementById('bookingSearch');
  if (bookingSearch) bookingSearch.addEventListener('input', debounce(() => { currentBookingsPage = 1; loadBookings(); }, 400));
  const bookingStatusFilter = document.getElementById('bookingStatusFilter');
  if (bookingStatusFilter) bookingStatusFilter.addEventListener('change', () => { currentBookingsPage = 1; loadBookings(); });
});

function debounce(fn, wait) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); }; }

/* ---------- Tabs ---------- */
function bindTabs() {
  document.querySelectorAll('.dash-nav a[data-tab]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      document.querySelectorAll('.dash-nav a').forEach((a) => a.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach((p) => (p.style.display = 'none'));
      const panel = document.getElementById(`tab-${tab}`);
      if (panel) panel.style.display = 'block';
      document.querySelector('.dash-sidebar')?.classList.remove('open');

      if (tab === 'bookings') loadBookings();
      if (Object.keys(RESOURCE_CONFIG).includes(tab)) loadResource(tab);
      if (tab === 'reviews') loadAdminReviews();
      if (tab === 'users') loadUsers();
      if (tab === 'dates') loadAdminCalendar();
      if (tab === 'overview') loadStats();
    });
  });
}

/* ---------- Overview stats ---------- */
async function loadStats() {
  try {
    const { stats } = await api('/bookings/stats/overview');
    setText('kpiTotalBookings', stats.totalBookings);
    setText('kpiTodayBookings', stats.todaysBookings);
    setText('kpiRevenue', `\u20B9${stats.revenue.toLocaleString('en-IN')}`);
    setText('kpiCustomers', stats.totalCustomers);
    const statusHtml = Object.entries(stats.statusCounts || {}).map(([k, v]) => `
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(244,234,217,0.06);">
        <span class="badge-status ${k}">${k}</span><strong>${v}</strong>
      </div>`).join('') || '<p style="color:var(--muted)">No bookings yet.</p>';
    const mount = document.getElementById('statusBreakdown');
    if (mount) mount.innerHTML = statusHtml;
  } catch (err) { toast(err.message, 'error'); }
}
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function escapeHtml(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeWhatsAppPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    digits = '91' + digits;
  }
  return digits;
}

function buildWhatsAppUrl(b) {
  const digits = normalizeWhatsAppPhone(b.phone);
  const dateStr = new Date(b.eventDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  let msg = '';
  if (b.status === 'accepted') {
    msg = `Hi ${b.customerName}, your Nazik Dhol booking (${b.bookingCode}) for ${b.eventType} on ${dateStr} at ${b.eventTime} (${b.venue}) has been ACCEPTED! 🥁 Our team will coordinate with you shortly.`;
  } else if (b.status === 'rejected') {
    const reasonText = b.statusNote ? ` Reason: ${b.statusNote}.` : '';
    msg = `Hi ${b.customerName}, thank you for considering Nazik Dhol. Regarding booking ${b.bookingCode} (${b.eventType} on ${dateStr}): unfortunately our team is unavailable for this slot.${reasonText} Please let us know if you would like to pick another date.`;
  } else if (b.status === 'completed') {
    msg = `Hi ${b.customerName}, thank you for celebrating your ${b.eventType} with Nazik Dhol (${b.bookingCode})! We hope you enjoyed the performance.`;
  } else {
    msg = `Hi ${b.customerName}, reaching out from Nazik Dhol regarding your booking ${b.bookingCode} (${b.eventType} on ${dateStr}, status: ${b.status}).`;
  }
  return `https://wa.me/${encodeURIComponent(digits)}?text=${encodeURIComponent(msg)}`;
}

function renderEmailNotificationBadge(b) {
  const emailInfo = b.notification && b.notification.email;
  if (!emailInfo || !emailInfo.status) return '';
  if (emailInfo.status === 'sent') {
    return `<div style="font-size:0.72rem;color:#52c41a;margin-top:4px;"><i class="fa-solid fa-envelope-circle-check"></i> Email sent</div>`;
  }
  const errTitle = escapeHtml(emailInfo.error || 'Email delivery failed');
  const label = emailInfo.status === 'skipped' ? 'Email skipped' : 'Email failed';
  return `<div style="font-size:0.72rem;color:#ff4d4f;margin-top:4px;" title="${errTitle}"><i class="fa-solid fa-triangle-exclamation"></i> ${label}</div>`;
}

/* ---------- Bookings management ---------- */
async function loadBookings() {
  const mount = document.getElementById('bookingsTableBody');
  if (!mount) return;
  mount.innerHTML = renderSkeletonRows(7, 4);
  const status = document.getElementById('bookingStatusFilter')?.value || '';
  const search = document.getElementById('bookingSearch')?.value || '';
  try {
    const query = new URLSearchParams({ page: currentBookingsPage, limit: 8, ...(status && { status }), ...(search && { search }) });
    const res = await api(`/bookings?${query}`);
    if (!res.bookings.length) {
      mount.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fa-solid fa-calendar-xmark"></i><p>No bookings found.</p></div></td></tr>`;
    } else {
      mount.innerHTML = res.bookings.map((b) => {
        const emailStatus = b.notification?.email?.status;
        const canResend =
          (b.status === 'accepted' || b.status === 'rejected') &&
          emailStatus !== 'sent';
        const waUrl = buildWhatsAppUrl(b);
        return `
        <tr>
          <td><strong>${escapeHtml(b.bookingCode)}</strong></td>
          <td>${escapeHtml(b.customerName)}<br><span style="color:var(--muted-dim);font-size:0.78rem;">${escapeHtml(b.phone)}</span></td>
          <td>${escapeHtml(b.eventType)}</td>
          <td>${new Date(b.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
          <td>${escapeHtml(b.venue)}</td>
          <td>
            <span class="badge-status ${escapeHtml(b.status)}">${escapeHtml(b.status)}</span>
            ${renderEmailNotificationBadge(b)}
            ${b.statusNote ? `<div style="font-size:0.72rem;color:var(--muted);margin-top:2px;" title="${escapeHtml(b.statusNote)}"><i class="fa-regular fa-note-sticky"></i> ${escapeHtml(b.statusNote.slice(0, 28))}${b.statusNote.length > 28 ? '...' : ''}</div>` : ''}
          </td>
          <td>
            <div class="table-actions">
              ${b.status === 'pending' ? `<button class="icon-action" title="Accept" onclick="setBookingStatus('${escapeHtml(b._id)}','accepted')"><i class="fa-solid fa-check"></i></button>
              <button class="icon-action danger" title="Reject" onclick="openRejectModal('${escapeHtml(b._id)}')"><i class="fa-solid fa-xmark"></i></button>` : ''}
              ${b.status === 'accepted' ? `<button class="icon-action" title="Mark Completed" onclick="setBookingStatus('${escapeHtml(b._id)}','completed')"><i class="fa-solid fa-flag-checkered"></i></button>` : ''}
              ${canResend ? `<button class="icon-action" title="Resend Email" onclick="resendBookingEmail('${escapeHtml(b._id)}')"><i class="fa-solid fa-paper-plane"></i></button>` : ''}
              <a class="icon-action" title="WhatsApp Customer" target="_blank" rel="noopener" href="${waUrl}" style="color:#25D366;"><i class="fa-brands fa-whatsapp"></i></a>
            </div>
          </td>
        </tr>
      `;
      }).join('');
    }
    renderPagination('bookingsPagination', res.page, res.pages, (p) => { currentBookingsPage = p; loadBookings(); });
  } catch (err) { mount.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>${escapeHtml(err.message)}</p></div></td></tr>`; }
}

function openRejectModal(bookingId) {
  let modal = document.getElementById('rejectBookingModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'rejectBookingModal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
  }

  modal.innerHTML = `
    <div class="glass-card modal-box" style="max-width:460px; text-align:left;">
      <h3 style="margin-bottom:10px;"><i class="fa-solid fa-circle-xmark" style="color:var(--red-bright)"></i> Reject Booking</h3>
      <p style="color:var(--muted);font-size:0.9rem;margin-bottom:16px;">Optionally add a short note or reason for the customer (included in the notification email and WhatsApp message).</p>
      <div class="form-group full" style="margin-bottom:16px;">
        <label for="rejectReasonInput">Reason / Note (optional)</label>
        <textarea id="rejectReasonInput" class="form-control" rows="3" maxlength="500" placeholder="e.g. Our troupe is already booked for another wedding at this time."></textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-outline" id="rejectCancelBtn">Cancel</button>
        <button type="button" class="btn btn-red" id="rejectConfirmBtn">Reject Booking</button>
      </div>
    </div>
  `;

  document.getElementById('rejectCancelBtn').addEventListener('click', () => modal.classList.remove('active'));
  document.getElementById('rejectConfirmBtn').addEventListener('click', async () => {
    const note = document.getElementById('rejectReasonInput')?.value.trim() || '';
    modal.classList.remove('active');
    await setBookingStatus(bookingId, 'rejected', note);
  });

  modal.classList.add('active');
  setTimeout(() => document.getElementById('rejectReasonInput')?.focus(), 80);
}
window.openRejectModal = openRejectModal;

async function setBookingStatus(id, status, note) {
  if (status === 'rejected' && note === undefined) {
    openRejectModal(id);
    return;
  }
  try {
    const payload = { status };
    if (typeof note === 'string' && note.length > 0) payload.note = note;
    const res = await api(`/bookings/${id}/status`, { method: 'PUT', body: payload });

    if (res.statusUnchanged) {
      toast(`Booking is already ${status}. No duplicate email sent.`, 'info');
    } else if (status === 'accepted' || status === 'rejected') {
      const label = status === 'accepted' ? 'Booking accepted' : 'Booking rejected';
      const emailStatus = res.notification?.email?.status || res.booking?.notification?.email?.status;
      if (emailStatus === 'sent') {
        toast(`${label}. Email sent to customer.`, 'success');
      } else if (emailStatus === 'skipped') {
        toast(`${label}, but the email failed (SMTP not configured).`, 'error');
      } else {
        toast(`${label}, but the email failed.`, 'error');
      }
    } else {
      toast(`Booking ${status}.`, 'success');
    }

    loadBookings();
    loadStats();
  } catch (err) { toast(err.message, 'error'); }
}
window.setBookingStatus = setBookingStatus;

async function resendBookingEmail(id) {
  try {
    toast('Sending notification email...', 'info');
    const res = await api(`/bookings/${id}/resend-email`, { method: 'POST' });
    const emailStatus = res.notification?.email?.status || res.booking?.notification?.email?.status;
    if (emailStatus === 'sent') {
      toast('Email sent to customer.', 'success');
    } else {
      const errDetail = res.notification?.email?.error || 'Check SMTP configuration.';
      toast(`Email failed to send (${errDetail})`, 'error');
    }
    loadBookings();
  } catch (err) {
    toast(err.message, 'error');
  }
}
window.resendBookingEmail = resendBookingEmail;

function renderPagination(mountId, page, pages, onClick) {
  const mount = document.getElementById(mountId);
  if (!mount) return;
  if (pages <= 1) { mount.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= pages; i++) html += `<button class="${i === page ? 'active' : ''}" data-p="${i}">${i}</button>`;
  mount.innerHTML = html;
  mount.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => onClick(Number(b.dataset.p))));
}

/* ---------- Generic resource CRUD (services/packages/team/gallery/videos) ---------- */
async function loadResource(key) {
  const cfg = RESOURCE_CONFIG[key];
  const mount = document.getElementById(`${key}TableBody`);
  if (!mount) return;
  mount.innerHTML = renderSkeletonRows(cfg.columns.length + 1, 3);
  try {
    const { data } = await api(`${cfg.endpoint}?admin=true`);
    if (!data.length) {
      mount.innerHTML = `<tr><td colspan="${cfg.columns.length + 1}"><div class="empty-state"><i class="fa-solid fa-box-open"></i><p>No ${cfg.title.toLowerCase()} yet. Add your first one.</p></div></td></tr>`;
      return;
    }
    mount.innerHTML = data.map((item) => `
      <tr>
        ${cfg.columns.map((c) => `<td>${c.render ? c.render(item[c.key]) : (item[c.key] ?? '')}</td>`).join('')}
        <td>
          <div class="table-actions">
            <button class="icon-action" title="Edit" onclick='openResourceModal("${key}", ${JSON.stringify(item).replace(/'/g, "&apos;")})'><i class="fa-solid fa-pen"></i></button>
            <button class="icon-action danger" title="Delete" onclick="deleteResource('${key}','${item._id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) { mount.innerHTML = `<tr><td colspan="${cfg.columns.length + 1}"><div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>${err.message}</p></div></td></tr>`; }
}

function openResourceModal(key, item = null) {
  const cfg = RESOURCE_CONFIG[key];
  let modal = document.getElementById('resourceModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'resourceModal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
  }

  const fieldsHtml = cfg.fields.map((f) => {
    const value = item ? (Array.isArray(item[f.name]) ? item[f.name].join(', ') : item[f.name] ?? '') : '';
    if (f.type === 'textarea') return `<div class="form-group full"><label>${f.label}</label><textarea class="form-control" name="${f.name}" ${f.required ? 'required' : ''}>${value}</textarea></div>`;
    if (f.type === 'select') return `<div class="form-group"><label>${f.label}</label><select class="form-control" name="${f.name}" ${f.required ? 'required' : ''}>${f.options.map((o) => `<option value="${o}" ${value === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
    if (f.type === 'checkbox') return `<div class="form-group"><label class="form-check"><input type="checkbox" name="${f.name}" ${item ? (item[f.name] ? 'checked' : '') : (f.name === 'isActive' ? 'checked' : '')}> ${f.label}</label></div>`;
    if (f.type === 'file') return `<div class="form-group"><label>${f.label}</label><input type="file" class="form-control file-input-preview" name="${f.name}" accept="image/*"><div class="preview-wrap" style="margin-top:10px; display:${item && item[f.name] ? 'block' : 'none'};"><img class="img-thumbnail-preview" src="${item && item[f.name] ? item[f.name] : ''}" style="width:70px; height:70px; object-fit:cover; border-radius:10px; border:1px solid var(--glass-border);"></div></div>`;
    return `<div class="form-group"><label>${f.label}</label><input type="${f.type}" class="form-control" name="${f.name}" value="${value}" ${f.required ? 'required' : ''}></div>`;
  }).join('');

  modal.innerHTML = `
    <div class="glass-card modal-box" style="max-width:560px; text-align:left;">
      <h3 style="margin-bottom:20px;"><i class="fa-solid fa-drum" style="color:var(--gold)"></i> ${item ? 'Edit' : 'Add'} ${cfg.title.replace(/s$/, '')}</h3>
      <form id="resourceForm" class="form-row" style="grid-template-columns:1fr 1fr;">
        ${fieldsHtml}
      </form>
      <div class="modal-actions" style="margin-top:10px;">
        <button class="btn btn-outline" id="resourceCancelBtn">Cancel</button>
        <button class="btn btn-primary" id="resourceSaveBtn">Save</button>
      </div>
    </div>`;

  document.getElementById('resourceCancelBtn').addEventListener('click', () => modal.classList.remove('active'));
  document.getElementById('resourceSaveBtn').addEventListener('click', () => submitResourceForm(key, item));
  modal.classList.add('active');

  // Set up live image preview listeners
  modal.querySelectorAll('.file-input-preview').forEach((input) => {
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const wrap = input.parentElement.querySelector('.preview-wrap');
      const img = input.parentElement.querySelector('.img-thumbnail-preview');
      if (file && wrap && img) {
        img.src = URL.createObjectURL(file);
        wrap.style.display = 'block';
      }
    });
  });
}
window.openResourceModal = openResourceModal;

async function submitResourceForm(key, item) {
  const cfg = RESOURCE_CONFIG[key];
  const form = document.getElementById('resourceForm');
  const formData = new FormData();

  cfg.fields.forEach((f) => {
    const el = form.querySelector(`[name="${f.name}"]`);
    if (f.type === 'checkbox') { formData.append(f.name, el.checked); return; }
    if (f.type === 'file') { if (el.files[0]) formData.append(f.name, el.files[0]); return; }
    if (f.list) {
      const arr = el.value.split(',').map((s) => s.trim()).filter(Boolean);
      arr.forEach((v) => formData.append(f.name, v));
      return;
    }
    formData.append(f.name, el.value);
  });

  const saveBtn = document.getElementById('resourceSaveBtn');
  saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  try {
    const url = `${API_BASE}${cfg.endpoint}${item ? '/' + item._id : ''}`;
    const token = localStorage.getItem('nd_token');
    const res = await fetch(url, {
      method: item ? 'PUT' : 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Save failed.');
    toast(`${cfg.title.replace(/s$/, '')} saved successfully.`, 'success');
    document.getElementById('resourceModal').classList.remove('active');
    loadResource(key);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    saveBtn.disabled = false; saveBtn.innerHTML = 'Save';
  }
}

function deleteResource(key, id) {
  const cfg = RESOURCE_CONFIG[key];
  openConfirmModal(`Delete this ${cfg.title.toLowerCase().replace(/s$/, '')}?`, 'This action cannot be undone.', async () => {
    try {
      await api(`${cfg.endpoint}/${id}`, { method: 'DELETE' });
      toast('Deleted successfully.', 'success');
      loadResource(key);
    } catch (err) { toast(err.message, 'error'); }
  });
}
window.deleteResource = deleteResource;

/* ---------- Reviews ---------- */
async function loadAdminReviews() {
  const mount = document.getElementById('reviewsTableBody');
  if (!mount) return;
  mount.innerHTML = renderSkeletonRows(5, 3);
  try {
    const { data } = await api('/reviews?all=true');
    if (!data.length) { mount.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i class="fa-solid fa-comment"></i><p>No reviews submitted yet.</p></div></td></tr>`; return; }
    mount.innerHTML = data.map((r) => `
      <tr>
        <td>${r.customerName}</td>
        <td>${'&#9733;'.repeat(r.rating)}</td>
        <td style="max-width:280px;">${r.comment}</td>
        <td><span class="badge-status ${r.isApproved ? 'accepted' : 'pending'}">${r.isApproved ? 'Approved' : 'Pending'}</span></td>
        <td>
          <div class="table-actions">
            ${!r.isApproved ? `<button class="icon-action" title="Approve" onclick="approveReview('${r._id}', true)"><i class="fa-solid fa-check"></i></button>` : `<button class="icon-action" title="Unpublish" onclick="approveReview('${r._id}', false)"><i class="fa-solid fa-eye-slash"></i></button>`}
            <button class="icon-action danger" title="Delete" onclick="deleteReview('${r._id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) { mount.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>${err.message}</p></div></td></tr>`; }
}
async function approveReview(id, val) {
  try { await api(`/reviews/${id}/approve`, { method: 'PUT', body: { isApproved: val } }); toast('Review updated.', 'success'); loadAdminReviews(); }
  catch (err) { toast(err.message, 'error'); }
}
function deleteReview(id) {
  openConfirmModal('Delete this review?', 'This action cannot be undone.', async () => {
    try { await api(`/reviews/${id}`, { method: 'DELETE' }); toast('Review deleted.', 'success'); loadAdminReviews(); }
    catch (err) { toast(err.message, 'error'); }
  });
}
window.approveReview = approveReview;
window.deleteReview = deleteReview;

/* ---------- Users ---------- */
async function loadUsers() {
  const mount = document.getElementById('usersTableBody');
  if (!mount) return;
  mount.innerHTML = renderSkeletonRows(5, 3);
  try {
    const { data } = await api('/users');
    if (!data.length) { mount.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i class="fa-solid fa-user-group"></i><p>No registered customers yet.</p></div></td></tr>`; return; }
    mount.innerHTML = data.map((u) => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td><span class="badge-status ${u.isActive ? 'accepted' : 'rejected'}">${u.isActive ? 'Active' : 'Inactive'}</span></td>
        <td>
          <div class="table-actions">
            <button class="icon-action" title="Toggle Status" onclick="toggleUser('${u._id}', ${!u.isActive})"><i class="fa-solid fa-power-off"></i></button>
            <button class="icon-action danger" title="Delete" onclick="deleteUser('${u._id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) { mount.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>${err.message}</p></div></td></tr>`; }
}
async function toggleUser(id, isActive) {
  try { await api(`/users/${id}/status`, { method: 'PUT', body: { isActive } }); toast('User status updated.', 'success'); loadUsers(); }
  catch (err) { toast(err.message, 'error'); }
}
function deleteUser(id) {
  openConfirmModal('Delete this user?', 'This will permanently remove their account.', async () => {
    try { await api(`/users/${id}`, { method: 'DELETE' }); toast('User deleted.', 'success'); loadUsers(); }
    catch (err) { toast(err.message, 'error'); }
  });
}
window.toggleUser = toggleUser;
window.deleteUser = deleteUser;

/* ---------- Calendar management ---------- */
async function loadAdminCalendar() {
  const form = document.getElementById('dateForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/dates', {
        method: 'POST',
        body: {
          date: document.getElementById('dateInput').value,
          status: document.getElementById('dateStatus').value,
          note: document.getElementById('dateNote').value,
        },
      });
      toast('Calendar date updated.', 'success');
      form.reset();
    } catch (err) { toast(err.message, 'error'); }
  }, { once: true });
}

function renderSkeletonRows(cols, rows = 3) {
  let html = '';
  for (let i = 0; i < rows; i++) {
    html += '<tr class="skeleton-row">';
    for (let j = 0; j < cols; j++) {
      const lengthClass = j % 3 === 0 ? 'short' : (j % 3 === 1 ? 'medium' : 'long');
      html += `<td><div class="skeleton-bar ${lengthClass}"></div></td>`;
    }
    html += '</tr>';
  }
  return html;
}

