/* =========================================================
   NAZIK DHOL — booking.js
   Booking form submission + interactive availability calendar
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    // Prefill from query params (e.g. coming from a service/package card)
    const params = new URLSearchParams(window.location.search);
    if (params.get('service')) {
      const evtSelect = document.getElementById('eventType');
      if (evtSelect) {
        const match = [...evtSelect.options].find((o) => o.value === params.get('service'));
        if (match) evtSelect.value = match.value;
      }
    }

    const user = getStoredUser();
    if (user) {
      const nameEl = document.getElementById('customerName');
      const emailEl = document.getElementById('email');
      const phoneEl = document.getElementById('phone');
      if (nameEl) nameEl.value = user.name;
      if (emailEl) emailEl.value = user.email;
      if (phoneEl) phoneEl.value = user.phone;
    }

    // Prevent picking a date in the past
    const dateInput = document.getElementById('eventDate');
    if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

    populatePackageOptions('packageSelect');

    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = bookingForm.querySelector('button[type="submit"]');

      const packageSelect = document.getElementById('packageSelect');
      const payload = {
        customerName: document.getElementById('customerName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim(),
        eventType: document.getElementById('eventType').value,
        eventDate: document.getElementById('eventDate').value,
        eventTime: document.getElementById('eventTime').value,
        venue: document.getElementById('venue').value.trim(),
        package: packageSelect.value || undefined,
        packageName: packageSelect.selectedOptions[0]?.dataset.name || '',
        specialRequirements: document.getElementById('specialRequirements').value.trim(),
      };

      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
      try {
        const res = await api('/bookings', { method: 'POST', body: payload, auth: !!getStoredUser() });
        document.getElementById('bookingSuccessCode').textContent = res.booking.bookingCode;
        document.getElementById('bookingSuccessModal').classList.add('active');
        bookingForm.reset();
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        btn.disabled = false; btn.innerHTML = 'Submit Booking Request <i class="fa-solid fa-paper-plane"></i>';
      }
    });
  }

  // ---------- Available Dates calendar ----------
  const calGrid = document.getElementById('calendarGrid');
  if (calGrid) initCalendar();
});

let calState = { month: new Date().getMonth(), year: new Date().getFullYear() };

async function initCalendar() {
  document.getElementById('calPrev').addEventListener('click', () => shiftCalendar(-1));
  document.getElementById('calNext').addEventListener('click', () => shiftCalendar(1));
  await renderCalendar();
}
async function shiftCalendar(dir) {
  calState.month += dir;
  if (calState.month < 0) { calState.month = 11; calState.year--; }
  if (calState.month > 11) { calState.month = 0; calState.year++; }
  await renderCalendar();
}
async function renderCalendar() {
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calMonthLabel').textContent = `${monthNames[calState.month]} ${calState.year}`;

  let dateMap = {};
  try {
    const { data } = await api(`/dates?month=${calState.month + 1}&year=${calState.year}`, { auth: false });
    data.forEach((d) => { dateMap[new Date(d.date).getDate()] = d.status; });
  } catch (e) { /* calendar still renders as all-available */ }

  const firstDay = new Date(calState.year, calState.month, 1).getDay();
  const daysInMonth = new Date(calState.year, calState.month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getMonth() === calState.month && today.getFullYear() === calState.year;

  const grid = document.getElementById('calendarGrid');
  let html = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => `<div class="dow">${d}</div>`).join('');
  for (let i = 0; i < firstDay; i++) html += `<div class="cal-day empty"></div>`;
  for (let day = 1; day <= daysInMonth; day++) {
    const status = dateMap[day] || 'available';
    const isToday = isCurrentMonth && today.getDate() === day;
    html += `<div class="cal-day ${status} ${isToday ? 'today' : ''}" title="${status}">${day}</div>`;
  }
  grid.innerHTML = html;
}
