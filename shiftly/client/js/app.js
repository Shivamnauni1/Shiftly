const API = 'http://localhost:5000/api';

function getToken() { return localStorage.getItem('token'); }
function getUser() { return JSON.parse(localStorage.getItem('user') || 'null'); }
function isLoggedIn() { return !!getToken(); }

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/pages/login.html';
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API + endpoint, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

function showAlert(id, message, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.className = `alert ${type}`;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

function buildNav(role) {
  const user = getUser();
  if (!user) {
    return `
      <nav>
        <a class="logo" href="/index.html">Shiftly</a>
        <div class="nav-links">
          <a href="/pages/jobs.html">Browse Jobs</a>
          <a href="/pages/login.html">Login</a>
          <a href="/pages/register.html" class="btn">Sign Up</a>
        </div>
      </nav>`;
  }
  if (user.role === 'student') {
    return `
      <nav>
        <a class="logo" href="/index.html">Shiftly</a>
        <div class="nav-links">
          <a href="/pages/jobs.html">Browse Jobs</a>
          <a href="/pages/student-dashboard.html">Dashboard</a>
          <a href="#" onclick="logout()">Logout</a>
        </div>
      </nav>`;
  }
  return `
    <nav>
      <a class="logo" href="/index.html">Shiftly</a>
      <div class="nav-links">
        <a href="/pages/post-job.html">Post Job</a>
        <a href="/pages/business-dashboard.html">Dashboard</a>
        <a href="#" onclick="logout()">Logout</a>
      </div>
    </nav>`;
}
