/* =========================================================
   NAZIK DHOL — misc.js
   FAQ accordion, contact form, review submission form,
   animated stat counters used on the home page.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item .faq-q').forEach((q) => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  document.querySelectorAll('.faq-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.faq-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.cat;
      document.querySelectorAll('.faq-item').forEach((item) => {
        item.style.display = (cat === 'All' || item.dataset.cat === cat) ? 'block' : 'none';
      });
    });
  });

  /* ---------- Contact form ---------- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
      try {
        const res = await api('/contact', {
          method: 'POST',
          auth: false,
          body: {
            name: document.getElementById('contactName').value.trim(),
            email: document.getElementById('contactEmail').value.trim(),
            phone: document.getElementById('contactPhone').value.trim(),
            message: document.getElementById('contactMessage').value.trim(),
          },
        });
        toast(res.message, 'success');
        contactForm.reset();
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        btn.disabled = false; btn.innerHTML = 'Send Message <i class="fa-solid fa-paper-plane"></i>';
      }
    });
  }

  /* ---------- Review submission form ---------- */
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    let selectedRating = 5;
    document.querySelectorAll('.star-input i').forEach((star) => {
      star.addEventListener('click', () => {
        selectedRating = Number(star.dataset.val);
        document.querySelectorAll('.star-input i').forEach((s) => s.style.opacity = Number(s.dataset.val) <= selectedRating ? 1 : 0.3);
      });
    });
    const user = getStoredUser();
    if (user) {
      const nameField = document.getElementById('reviewName');
      if (nameField) nameField.value = user.name;
    }
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = reviewForm.querySelector('button[type="submit"]');
      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
      try {
        const res = await api('/reviews', {
          method: 'POST',
          body: {
            customerName: document.getElementById('reviewName').value.trim(),
            eventType: document.getElementById('reviewEvent').value,
            rating: selectedRating,
            comment: document.getElementById('reviewComment').value.trim(),
          },
        });
        toast(res.message, 'success');
        reviewForm.reset();
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        btn.disabled = false; btn.innerHTML = 'Submit Review <i class="fa-solid fa-paper-plane"></i>';
      }
    });
  }

  /* ---------- Animated stat counters ---------- */
  const counters = document.querySelectorAll('.stat-num[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    counters.forEach((c) => obs.observe(c));
  }
});

function animateCounter(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const duration = 1600;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(tick);
}
