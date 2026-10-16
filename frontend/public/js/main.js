/* =========================================================
   NAZIK DHOL — main.js
   Shared across every page: API helper, navbar/footer render,
   toasts, mobile menu, scroll reveal, WhatsApp float button.
   ========================================================= */

const API_BASE = '/api';

/* ---------- Tiny fetch wrapper ---------- */
async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('nd_token');
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try { data = await res.json(); } catch (e) { data = {}; }

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }
  return data;
}

/* ---------- Auth state helpers ---------- */
function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('nd_user') || 'null'); } catch (e) { return null; }
}
function setAuthSession(token, user) {
  localStorage.setItem('nd_token', token);
  localStorage.setItem('nd_user', JSON.stringify(user));
}
function clearAuthSession() {
  localStorage.removeItem('nd_token');
  localStorage.removeItem('nd_user');
}
function requireAuth(role) {
  const user = getStoredUser();
  if (!user) { window.location.href = '/login.html'; return null; }
  if (role && user.role !== role) { window.location.href = '/index.html'; return null; }
  return user;
}

/* ---------- Toasts ---------- */
function toast(message, type = 'info') {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${message}</span>`;
  stack.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(30px)'; setTimeout(() => el.remove(), 300); }, 3800);
}
window.toast = toast;
window.api = api;
window.getStoredUser = getStoredUser;
window.setAuthSession = setAuthSession;
window.clearAuthSession = clearAuthSession;
window.requireAuth = requireAuth;

/* ---------- Nav links config ---------- */
const NAV_LINKS = [
  { href: '/index.html', label: 'Home' },
  { href: '/about.html', label: 'About' },
  { href: '/services.html', label: 'Services' },
  { href: '/packages.html', label: 'Packages' },
  { href: '/team.html', label: 'Team' },
  { href: '/gallery.html', label: 'Gallery' },
  { href: '/reviews.html', label: 'Reviews' },
  { href: '/contact.html', label: 'Contact' },
];

const DRUM_MARK_SVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="brand-mark">
  <defs>
    <linearGradient id="ndGold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f3d576"/>
      <stop offset="50%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#9c7a1e"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="46" fill="none" stroke="url(#ndGold)" stroke-width="3"/>
  <ellipse cx="50" cy="32" rx="34" ry="12" fill="none" stroke="url(#ndGold)" stroke-width="3"/>
  <ellipse cx="50" cy="68" rx="34" ry="12" fill="none" stroke="url(#ndGold)" stroke-width="3"/>
  <path d="M16 32 L16 68 M84 32 L84 68" stroke="url(#ndGold)" stroke-width="3"/>
  <path d="M20 34 L44 66 M80 34 L56 66 M20 66 L44 34 M80 66 L56 34" stroke="#a11d1d" stroke-width="2" opacity="0.85"/>
</svg>`;

/* ---------- Render navbar ---------- */
function renderNavbar() {
  const mount = document.getElementById('site-header');
  if (!mount) return;
  const current = window.location.pathname.split('/').pop() || 'index.html';
  const user = getStoredUser();

  const homeHref = '/index.html';

  const linksHtml = NAV_LINKS.map((l) => {
    return `<a href="${l.href}" class="${current === l.href.replace('/', '') ? 'active' : ''}">${l.label}</a>`;
  }).join('');

  const dashHref = user ? (user.role === 'admin' ? '/admin-dashboard.html' : '/dashboard.html') : '/login.html';
  const actionsHtml = user
    ? `
      <div class="user-dropdown" id="userDropdown">
        <button class="user-chip" id="userChipBtn" aria-expanded="false" aria-haspopup="true">
          <span class="avatar-mini">${user.name.charAt(0).toUpperCase()}</span>
          <span>${user.name.split(' ')[0]}</span>
          <i class="fa-solid fa-chevron-down" style="font-size:0.7rem; margin-left:4px; transition: transform 0.2s ease;"></i>
        </button>
        <div class="dropdown-menu">
          <div class="dropdown-header">
            <strong>${user.name}</strong>
            <span style="font-size:0.75rem; color:var(--muted); margin-top:2px; display:block;">${user.email}</span>
          </div>
          <div class="dropdown-divider"></div>
          <a href="${dashHref}"><i class="fa-solid fa-gauge"></i> My Dashboard</a>
          <a href="${dashHref}#profile"><i class="fa-solid fa-user-pen"></i> Edit Profile</a>
          <div class="dropdown-divider"></div>
          <a href="#" class="logout-btn" style="color:var(--red-bright);"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</a>
        </div>
      </div>
      `
    : `<a href="/login.html" class="btn btn-outline btn-sm">Login</a>`;

  const mobileActionsHtml = user
    ? `
      <div class="dropdown-divider" style="height:1px; background:var(--glass-border); margin:12px 0;"></div>
      <a href="${dashHref}"><i class="fa-solid fa-gauge" style="margin-right:8px;"></i> My Dashboard</a>
      <a href="${dashHref}#profile"><i class="fa-solid fa-user-pen" style="margin-right:8px;"></i> Edit Profile</a>
      <a href="#" class="logout-btn" style="color:var(--red-bright);"><i class="fa-solid fa-right-from-bracket" style="margin-right:8px;"></i> Sign Out</a>
      `
    : `<a href="/login.html">Login / Register</a>`;

  mount.innerHTML = `
    <nav class="navbar" id="navbar">
      <div class="container">
        <a href="${homeHref}" class="brand">
          ${DRUM_MARK_SVG}
          <div class="brand-text"><span class="name">Nazik Dhol</span><span class="tag">Est. Festival Beats</span></div>
        </a>
        <div class="nav-links">${linksHtml}</div>
        <div class="nav-actions">
          ${actionsHtml}
          <a href="/booking.html" class="btn btn-primary btn-sm">Book Now</a>
          <button class="nav-toggle" id="navToggle" aria-label="Open menu"><i class="fa-solid fa-bars"></i></button>
        </div>
      </div>
    </nav>
    <div class="menu-overlay" id="menuOverlay"></div>
    <div class="mobile-menu" id="mobileMenu">
      ${linksHtml}
      <a href="/booking.html">Book Now</a>
      ${mobileActionsHtml}
    </div>
  `;

  // Bind dropdown toggle
  const userDropdown = document.getElementById('userDropdown');
  const userChipBtn = document.getElementById('userChipBtn');
  if (userChipBtn && userDropdown) {
    userChipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('active');
      const expanded = userDropdown.classList.contains('active');
      userChipBtn.setAttribute('aria-expanded', expanded);
    });
    document.addEventListener('click', (e) => {
      if (!userDropdown.contains(e.target)) {
        userDropdown.classList.remove('active');
        userChipBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('menuOverlay');
  const closeMenu = () => { mobileMenu.classList.remove('open'); overlay.classList.remove('active'); document.body.classList.remove('no-scroll'); };
  
  if (navToggle && mobileMenu && overlay) {
    navToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open'); overlay.classList.toggle('active'); document.body.classList.toggle('no-scroll');
    });
    overlay.addEventListener('click', closeMenu);
    mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
  }

  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    });
  }
}

/* ---------- Render footer ---------- */
function renderFooter() {
  const mount = document.getElementById('site-footer');
  if (!mount) return;
  const year = new Date().getFullYear();
  mount.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col">
            <div class="brand" style="margin-bottom:18px;">
              ${DRUM_MARK_SVG}
              <div class="brand-text"><span class="name">Nazik Dhol</span><span class="tag">Est. Festival Beats</span></div>
            </div>
            <p>Premium dhol performances that turn every entry, every celebration, into a moment people remember.</p>
            <div class="footer-social">
              <a href="#" class="btn-icon" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
              <a href="#" class="btn-icon" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
              <a href="#" class="btn-icon" aria-label="YouTube"><i class="fa-brands fa-youtube"></i></a>
              <a href="#" class="btn-icon" aria-label="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
            </div>
          </div>
          <div class="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/about.html">About Us</a></li>
              <li><a href="/services.html">Services</a></li>
              <li><a href="/packages.html">Packages</a></li>
              <li><a href="/team.html">Our Team</a></li>
              <li><a href="/faq.html">FAQ</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><a href="/gallery.html">Gallery</a></li>
              <li><a href="/videos.html">Videos</a></li>
              <li><a href="/available-dates.html">Available Dates</a></li>
              <li><a href="/reviews.html">Reviews</a></li>
              <li><a href="/booking.html">Book Now</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Contact</h4>
            <ul>
              <li><i class="fa-solid fa-location-dot" style="color:var(--gold);margin-right:8px;"></i>Ambedkar Nagar, Rajapalayam</li>
              <li><i class="fa-solid fa-phone" style="color:var(--gold);margin-right:8px;"></i>+91 6385121495</li>
              <li><i class="fa-solid fa-envelope" style="color:var(--gold);margin-right:8px;"></i>warloopgaming136@gmail.com</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; ${year} Nazik Dhol. All rights reserved.</p>
          <p>Crafted with <i class="fa-solid fa-heart" style="color:var(--red-bright);"></i> for the rhythm of celebration.</p>
        </div>
      </div>
    </footer>
  `;
}

/* ---------- Floating actions (WhatsApp + back to top) ---------- */
async function renderFloatActions() {
  const mount = document.createElement('div');
  mount.className = 'float-actions';
  let wa = '916385121495';
  try {
    const cfg = await api('/config/public', { auth: false });
    if (cfg.whatsappNumber) wa = cfg.whatsappNumber;
  } catch (e) { /* fall back to default number */ }

  mount.innerHTML = `
    <a class="float-btn top" id="backToTop" aria-label="Back to top"><i class="fa-solid fa-arrow-up"></i></a>
    <a class="float-btn whatsapp" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=Hi%20Nazik%20Dhol%2C%20I%27d%20like%20to%20enquire%20about%20booking!" aria-label="Chat on WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
  `;
  document.body.appendChild(mount);

  const topBtn = document.getElementById('backToTop');
  if (topBtn) {
    window.addEventListener('scroll', () => topBtn.classList.toggle('show', window.scrollY > 500));
    topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
}

/* ---------- Scroll reveal ---------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || !els.length) { els.forEach((e) => e.classList.add('in')); return; }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('in'); obs.unobserve(entry.target); } });
  }, { threshold: 0.12 });
  els.forEach((el) => obs.observe(el));
}

/* ---------- Page loader ---------- */
function hidePageLoader() {
  const loader = document.querySelector('.page-loader');
  if (loader) setTimeout(() => loader.classList.add('hidden'), 250);
}

/* ---------- Generic confirm modal (shared by dashboard.js and admin.js) ---------- */
function openConfirmModal(title, message, onConfirm) {
  let modal = document.getElementById('confirmModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="glass-card modal-box">
        <i class="fa-solid fa-triangle-exclamation big"></i>
        <h3 id="confirmTitle"></h3>
        <p id="confirmMessage"></p>
        <div class="modal-actions">
          <button class="btn btn-outline" id="confirmCancelBtn">Go Back</button>
          <button class="btn btn-red" id="confirmOkBtn">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    document.getElementById('confirmCancelBtn').addEventListener('click', () => modal.classList.remove('active'));
  }
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  const okBtn = document.getElementById('confirmOkBtn');
  const newOkBtn = okBtn.cloneNode(true);
  okBtn.replaceWith(newOkBtn);
  newOkBtn.addEventListener('click', () => { modal.classList.remove('active'); onConfirm(); });
  modal.classList.add('active');
}
window.openConfirmModal = openConfirmModal;

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
  renderFloatActions();
  initReveal();
  hidePageLoader();

  // Bind logout buttons globally (present in dashboards and header)
  document.querySelectorAll('.logout-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try { await api('/auth/logout', { method: 'POST' }); } catch (err) { /* ignore */ }
      clearAuthSession();
      window.location.href = '/index.html';
    });
  });
});
