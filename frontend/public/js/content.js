/* =========================================================
   NAZIK DHOL — content.js
   Fetches and renders dynamic content: services, packages,
   team, gallery, videos, reviews. Shared by multiple pages.
   ========================================================= */

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop';

function starIcons(rating) {
  return Array.from({ length: 5 }, (_, i) => `<i class="fa-solid fa-star" style="opacity:${i < rating ? 1 : 0.25}"></i>`).join('');
}

/* ---------- Services ---------- */
async function loadServices(targetId, limit) {
  const mount = document.getElementById(targetId);
  if (!mount) return;
  try {
    const { data } = await api('/services', { auth: false });
    const items = limit ? data.slice(0, limit) : data;
    if (!items.length) { mount.innerHTML = emptyState('fa-drum', 'Services coming soon.'); return; }
    mount.innerHTML = items.map((s) => `
      <div class="glass-card service-card reveal">
        <div class="thumb">
          <img src="${s.image || PLACEHOLDER_IMG}" alt="${s.title}" loading="lazy">
          <span class="icon-badge"><i class="fa-solid ${s.icon || 'fa-drum'}"></i></span>
        </div>
        <div class="body">
          <h3>${s.title}</h3>
          <p>${s.description}</p>
          <div class="meta">
            <span class="price">From &#8377;${s.startingPrice.toLocaleString('en-IN')}</span>
            <span class="duration"><i class="fa-regular fa-clock"></i> ${s.duration}</span>
          </div>
          <a href="/booking.html?service=${encodeURIComponent(s.title)}" class="btn btn-primary btn-sm btn-block">Book This Service</a>
        </div>
      </div>
    `).join('');
    initReveal();
  } catch (e) { mount.innerHTML = emptyState('fa-triangle-exclamation', 'Could not load services right now.'); }
}

/* ---------- Packages ---------- */
async function loadPackages(targetId) {
  const mount = document.getElementById(targetId);
  if (!mount) return;
  try {
    const { data } = await api('/packages', { auth: false });
    if (!data.length) { mount.innerHTML = emptyState('fa-gift', 'Packages coming soon.'); return; }
    mount.innerHTML = data.map((p) => `
      <div class="glass-card package-card reveal ${p.isPopular ? 'popular' : ''}">
        ${p.isPopular ? '<span class="badge">Most Popular</span>' : ''}
        <h3>${p.name}</h3>
        <div class="price">&#8377;${p.price.toLocaleString('en-IN')} <span>/ event</span></div>
        <div class="pkg-meta">
          <span><i class="fa-solid fa-users"></i> ${p.numberOfMembers} Members</span>
          <span><i class="fa-regular fa-clock"></i> ${p.duration}</span>
        </div>
        <ul>
          ${p.features.map((f) => `<li><i class="fa-solid fa-check"></i>${f}</li>`).join('')}
          <li><i class="fa-solid fa-drum"></i>Instruments: ${p.instrumentsIncluded.join(', ')}</li>
        </ul>
        <a href="/booking.html?package=${encodeURIComponent(p.name)}" class="btn ${p.isPopular ? 'btn-primary' : 'btn-outline'} btn-block">Book Now</a>
      </div>
    `).join('');
    initReveal();
  } catch (e) { mount.innerHTML = emptyState('fa-triangle-exclamation', 'Could not load packages right now.'); }
}

/* ---------- Team ---------- */
async function loadTeam(targetId, limit) {
  const mount = document.getElementById(targetId);
  if (!mount) return;
  try {
    const { data } = await api('/team', { auth: false });
    const items = (limit ? data.slice(0, limit) : data).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    if (!items.length) { mount.innerHTML = emptyState('fa-user-group', 'Team profiles coming soon.'); return; }
    mount.innerHTML = items.map((m) => `
      <div class="glass-card team-card reveal">
        <div class="team-photo"><img src="${m.photo || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop'}" alt="${m.name}" loading="lazy"></div>
        <h3>${m.name}</h3>
        <div class="role">${m.role}</div>
        <div class="exp"><i class="fa-solid fa-medal" style="color:var(--gold)"></i> ${m.experience} experience</div>
        <a href="tel:${m.phone}" class="phone"><i class="fa-solid fa-phone"></i> ${m.phone}</a>
      </div>
    `).join('');
    initReveal();
  } catch (e) { mount.innerHTML = emptyState('fa-triangle-exclamation', 'Could not load team right now.'); }
}

/* ---------- Gallery ---------- */
let galleryData = [];
let galleryIndex = 0;
async function loadGallery(targetId, limit) {
  const mount = document.getElementById(targetId);
  if (!mount) return;
  try {
    const { data } = await api('/gallery', { auth: false });
    galleryData = data;
    renderGallery(mount, limit ? data.slice(0, limit) : data);
    initReveal();
  } catch (e) { mount.innerHTML = emptyState('fa-triangle-exclamation', 'Could not load gallery right now.'); }
}
function renderGallery(mount, items) {
  if (!items.length) { mount.innerHTML = emptyState('fa-images', 'No photos in this category yet.'); return; }
  mount.innerHTML = items.map((g, i) => `
    <div class="gallery-item reveal ${i % 7 === 0 ? 'wide' : ''}" onclick="openLightbox('${g._id}')">
      <img src="${g.image || PLACEHOLDER_IMG}" alt="${g.title}" loading="lazy">
      <div class="overlay"><span>${g.title}</span></div>
    </div>
  `).join('');
}
function openLightbox(id) {
  const idx = galleryData.findIndex((g) => g._id === id);
  if (idx === -1) return;
  galleryIndex = idx;
  showLightboxImage();
  document.getElementById('lightbox').classList.add('active');
}
function showLightboxImage() {
  const g = galleryData[galleryIndex];
  const img = document.getElementById('lightboxImg');
  if (img && g) img.src = g.image || PLACEHOLDER_IMG;
}
function closeLightbox() { document.getElementById('lightbox')?.classList.remove('active'); }
function lightboxNav(dir) {
  galleryIndex = (galleryIndex + dir + galleryData.length) % galleryData.length;
  showLightboxImage();
}
function filterGallery(category, btn) {
  document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = category === 'All' ? galleryData : galleryData.filter((g) => g.category === category);
  renderGallery(document.getElementById('galleryGrid'), filtered);
}
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.lightboxNav = lightboxNav;
window.filterGallery = filterGallery;

/* ---------- Videos ---------- */
async function loadVideos(targetId) {
  const mount = document.getElementById(targetId);
  if (!mount) return;
  try {
    const { data } = await api('/videos', { auth: false });
    if (!data.length) { mount.innerHTML = emptyState('fa-video', 'Videos coming soon.'); return; }
    mount.innerHTML = data.map((v) => `
      <div class="glass-card video-card reveal">
        <div class="video-frame"><iframe src="https://www.youtube.com/embed/${v.youtubeId}" title="${v.title}" allowfullscreen loading="lazy"></iframe></div>
        <div class="body">
          <h3>${v.title}</h3>
          <span class="cat">${v.category}</span>
        </div>
      </div>
    `).join('');
    initReveal();
  } catch (e) { mount.innerHTML = emptyState('fa-triangle-exclamation', 'Could not load videos right now.'); }
}

/* ---------- Reviews ---------- */
async function loadReviews(targetId, layout = 'grid') {
  const mount = document.getElementById(targetId);
  if (!mount) return;
  try {
    const { data } = await api('/reviews', { auth: false });
    if (!data.length) { mount.innerHTML = emptyState('fa-comment', 'No reviews yet — be the first!'); return; }
    mount.className = layout === 'scroll' ? 'review-scroll' : mount.className;
    mount.innerHTML = data.map((r) => `
      <div class="glass-card review-card reveal">
        <div class="review-stars">${starIcons(r.rating)}</div>
        <p class="comment">&ldquo;${r.comment}&rdquo;</p>
        <div class="review-person">
          ${r.photo ? `<img src="${r.photo}" alt="${r.customerName}">` : `<span class="initial">${r.customerName.charAt(0)}</span>`}
          <div><div class="name">${r.customerName}</div><div class="event">${r.eventType || 'Verified Booking'}</div></div>
        </div>
      </div>
    `).join('');
    initReveal();
  } catch (e) { mount.innerHTML = emptyState('fa-triangle-exclamation', 'Could not load reviews right now.'); }
}

/* ---------- Package/Service <select> options (used in booking form) ---------- */
async function populatePackageOptions(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  try {
    const { data } = await api('/packages', { auth: false });
    data.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p._id;
      opt.textContent = `${p.name} — \u20B9${p.price.toLocaleString('en-IN')}`;
      opt.dataset.name = p.name;
      select.appendChild(opt);
    });
    const params = new URLSearchParams(window.location.search);
    const wanted = params.get('package');
    if (wanted) {
      const match = [...select.options].find((o) => o.dataset.name === wanted);
      if (match) select.value = match.value;
    }
  } catch (e) { /* select still usable without prefilled options */ }
}
window.populatePackageOptions = populatePackageOptions;

function emptyState(icon, text) {
  return `<div class="empty-state"><i class="fa-solid ${icon}"></i><p>${text}</p></div>`;
}
