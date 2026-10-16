/* =========================================================
   NAZIK DHOL — auth.js (login / register / forgot password)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Redirect already-logged-in users away from login/register pages
  const user = getStoredUser();
  const page = window.location.pathname.split('/').pop();
  if (user && (page === 'login.html' || page === 'register.html')) {
    window.location.href = user.role === 'admin' ? '/admin-dashboard.html' : '/dashboard.html';
    return;
  }

  let activeRole = 'user';
  const tabCustomer = document.getElementById('tabCustomer');
  const tabAdmin = document.getElementById('tabAdmin');
  const regPrompt = document.getElementById('registerPrompt');
  const loginDesc = document.getElementById('loginDesc');

  // Remember Me Prefill
  const loginEmail = document.getElementById('loginEmail');
  const rememberMe = document.getElementById('rememberMe');
  if (loginEmail && rememberMe) {
    const remembered = localStorage.getItem('nd_remembered_email');
    if (remembered) {
      loginEmail.value = remembered;
      rememberMe.checked = true;
    }
  }

  // Password Visibility Toggle
  document.querySelectorAll('.password-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const input = btn.parentElement.querySelector('input');
      const icon = btn.querySelector('i');
      if (input && icon) {
        if (input.type === 'password') {
          input.type = 'text';
          icon.className = 'fa-solid fa-eye-slash';
        } else {
          input.type = 'password';
          icon.className = 'fa-solid fa-eye';
        }
      }
    });
  });

  // Password Strength Meter
  const regPassword = document.getElementById('regPassword');
  const strengthMeter = document.getElementById('strengthMeter');
  const strengthText = document.getElementById('strengthText');
  if (regPassword && strengthMeter && strengthText) {
    regPassword.addEventListener('input', () => {
      const val = regPassword.value;
      if (!val) {
        strengthMeter.style.display = 'none';
        return;
      }
      strengthMeter.style.display = 'block';
      let score = 0;
      if (val.length >= 6) score++;
      if (/[0-9]/.test(val) && /[a-zA-Z]/.test(val)) score++;
      if (/[^a-zA-Z0-9]/.test(val) && val.length >= 8) score++;

      const segments = strengthMeter.querySelectorAll('.strength-segment');
      segments.forEach((seg) => seg.style.backgroundColor = 'rgba(244,234,217,0.06)');

      if (val.length < 6) {
        segments[0].style.backgroundColor = 'var(--danger)';
        strengthText.textContent = 'Weak (Min. 6 chars)';
        strengthText.style.color = 'var(--danger)';
      } else if (score === 1) {
        segments[0].style.backgroundColor = 'var(--danger)';
        strengthText.textContent = 'Weak';
        strengthText.style.color = 'var(--danger)';
      } else if (score === 2) {
        segments[0].style.backgroundColor = 'var(--warning)';
        segments[1].style.backgroundColor = 'var(--warning)';
        strengthText.textContent = 'Medium';
        strengthText.style.color = 'var(--warning)';
      } else if (score >= 3) {
        segments[0].style.backgroundColor = 'var(--success)';
        segments[1].style.backgroundColor = 'var(--success)';
        segments[2].style.backgroundColor = 'var(--success)';
        strengthText.textContent = 'Strong';
        strengthText.style.color = 'var(--success)';
      }
    });
  }

  if (tabCustomer && tabAdmin) {
    tabCustomer.addEventListener('click', () => {
      activeRole = 'user';
      tabCustomer.classList.add('active');
      tabAdmin.classList.remove('active');
      if (regPrompt) regPrompt.style.display = 'block';
      if (loginDesc) loginDesc.textContent = 'Login to manage your bookings with Nazik Dhol';
    });

    tabAdmin.addEventListener('click', () => {
      activeRole = 'admin';
      tabAdmin.classList.add('active');
      tabCustomer.classList.remove('active');
      if (regPrompt) regPrompt.style.display = 'none';
      if (loginDesc) loginDesc.textContent = 'Administrator access to manage bookings and resources';
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector('button[type="submit"]');
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';
      try {
        const res = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false });
        
        // Enforce role separation
        if (activeRole === 'admin' && res.user.role !== 'admin') {
          throw new Error('Access Denied: This account does not have administrator privileges.');
        }
        if (activeRole === 'user' && res.user.role !== 'user') {
          throw new Error('Please use the Admin Login tab to sign in with an administrator account.');
        }

        setAuthSession(res.token, res.user);
        
        // Remember Me Persistence
        if (rememberMe && rememberMe.checked) {
          localStorage.setItem('nd_remembered_email', email);
        } else {
          localStorage.removeItem('nd_remembered_email');
        }
        toast(`Welcome back, ${res.user.name.split(' ')[0]}!`, 'success');
        setTimeout(() => {
          window.location.href = res.user.role === 'admin' ? '/admin-dashboard.html' : '/dashboard.html';
        }, 600);
      } catch (err) {
        toast(err.message, 'error');
        btn.disabled = false; btn.innerHTML = 'Login <i class="fa-solid fa-arrow-right"></i>';
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  const regEmailInput = document.getElementById('regEmail');
  const emailErrorMsg = document.getElementById('emailErrorMsg');

  // Live Gmail validation on input
  if (regEmailInput) {
    regEmailInput.addEventListener('input', () => {
      const val = regEmailInput.value.trim().toLowerCase();
      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (val.length > 0 && !gmailRegex.test(val)) {
        regEmailInput.style.borderColor = 'var(--red-bright, #ff4d4f)';
        if (emailErrorMsg) {
          emailErrorMsg.style.display = 'block';
          emailErrorMsg.textContent = val.includes('@') && !val.endsWith('@gmail.com')
            ? 'Only valid @gmail.com addresses are allowed.'
            : 'Please enter a valid Gmail address (ending with @gmail.com).';
        }
      } else {
        regEmailInput.style.borderColor = val.length > 0 ? '#52c41a' : '';
        if (emailErrorMsg) emailErrorMsg.style.display = 'none';
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = registerForm.querySelector('button[type="submit"]');
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim().toLowerCase();
      const phone = document.getElementById('regPhone').value.trim();
      const password = document.getElementById('regPassword').value;
      const confirmPassword = document.getElementById('regConfirmPassword').value;

      // Strict Gmail validation check
      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!gmailRegex.test(email)) {
        toast('Please enter a valid Gmail address ending with @gmail.com', 'error');
        if (regEmailInput) {
          regEmailInput.focus();
          regEmailInput.style.borderColor = 'var(--red-bright, #ff4d4f)';
        }
        if (emailErrorMsg) {
          emailErrorMsg.style.display = 'block';
          emailErrorMsg.textContent = 'Please provide a valid Gmail address (must end with @gmail.com).';
        }
        return;
      }

      if (password !== confirmPassword) {
        toast('Passwords do not match.', 'error');
        return;
      }
      if (password.length < 6) {
        toast('Password must be at least 6 characters.', 'error');
        return;
      }

      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating account...';
      try {
        const res = await api('/auth/register', { method: 'POST', body: { name, email, phone, password, confirmPassword }, auth: false });
        setAuthSession(res.token, res.user);
        toast('Account created! Welcome to Nazik Dhol.', 'success');
        setTimeout(() => { window.location.href = '/dashboard.html'; }, 600);
      } catch (err) {
        toast(err.message, 'error');
        btn.disabled = false; btn.innerHTML = 'Create Account <i class="fa-solid fa-arrow-right"></i>';
      }
    });
  }

  const forgotForm = document.getElementById('forgotForm');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = forgotForm.querySelector('button[type="submit"]');
      const email = document.getElementById('forgotEmail').value.trim();
      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
      try {
        const res = await api('/auth/forgot-password', { method: 'POST', body: { email }, auth: false });
        toast(res.message, 'success');
        forgotForm.reset();
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        btn.disabled = false; btn.innerHTML = 'Send Reset Link';
      }
    });
  }

  // Logout buttons (present in dashboards)
  document.querySelectorAll('.logout-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try { await api('/auth/logout', { method: 'POST' }); } catch (err) { /* ignore */ }
      clearAuthSession();
      window.location.href = '/login.html';
    });
  });
});
