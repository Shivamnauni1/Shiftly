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

function stars(rating) {
  const r = Math.round(rating);
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

function getCountdown(shiftStartsAt, shiftEndsAt) {
  const now = new Date();
  const start = new Date(shiftStartsAt);
  const end = new Date(shiftEndsAt);
  if (now > end) return { text: 'Ended', cls: '' };
  if (now > start) return { text: 'In progress', cls: 'starting' };
  const diff = start - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h < 1) return { text: `Starts in ${m}m`, cls: 'urgent' };
  if (h < 3) return { text: `Starts in ${h}h ${m}m`, cls: 'urgent' };
  return { text: `Starts in ${h}h`, cls: '' };
}

// Refresh all countdowns on the page every 60 seconds
function startCountdownTicker() {
  setInterval(() => {
    document.querySelectorAll('[data-starts-at]').forEach(el => {
      const startsAt = el.getAttribute('data-starts-at');
      const endsAt = el.getAttribute('data-ends-at');
      const cd = getCountdown(startsAt, endsAt);
      el.textContent = cd.text;
      el.className = `countdown ${cd.cls}`;
    });
  }, 60000);
}

// Geocode a location string to lat/lng using OpenStreetMap (free, no API key)
async function geocodeLocation(locationText) {
  try {
    const encoded = encodeURIComponent(locationText + ', India');
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`);
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) { console.warn('Geocoding failed:', e); }
  return null;
}

function buildJobCard(job, user) {
  const slotPct = job.slotsTotal > 0 ? (job.slotsFilled / job.slotsTotal) * 100 : 0;
  const slotsLeft = job.slotsTotal - job.slotsFilled;
  const isFull = job.status === 'full';
  const cd = getCountdown(job.shiftStartsAt, job.shiftEndsAt);

  return `
  <div class="job-card">
    <div class="job-card-header">
      <div class="job-card-title">${job.title}</div>
      <span class="job-category-badge">${job.category}</span>
    </div>
    <div class="job-meta">
      <div class="job-meta-row"><span>📍</span>${job.location}</div>
      <div class="job-meta-row"><span>🏪</span>${job.businessName}</div>
      <div class="job-meta-row"><span>📅</span>${job.date} &nbsp;·&nbsp; ${job.startTime} – ${job.endTime}</div>
      ${job.description ? `<div class="job-meta-row" style="color:var(--text-muted);font-size:0.82rem;margin-top:0.2rem">${job.description.substring(0,90)}${job.description.length>90?'...':''}</div>` : ''}
    </div>
    <div class="job-pay">₹${job.pay}<small>/hr</small></div>
    <div class="job-footer">
      <div class="slots-bar">
        <div class="slots-label">${isFull ? 'All slots filled' : `${slotsLeft} slot${slotsLeft!==1?'s':''} left of ${job.slotsTotal}`}</div>
        <div class="slots-track"><div class="slots-fill ${isFull?'full':''}" style="width:${slotPct}%"></div></div>
      </div>
      <div class="countdown ${cd.cls}" data-starts-at="${job.shiftStartsAt}" data-ends-at="${job.shiftEndsAt}">${cd.text}</div>
    </div>
    <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
      ${isFull
        ? `<span class="badge full">Fully Booked</span>`
        : user && user.role === 'student'
          ? `<button class="btn btn-primary btn-sm" onclick="apply('${job._id}', this)">Apply Now</button>`
          : `<a href="/pages/login.html" class="btn btn-secondary btn-sm">Login to Apply</a>`
      }
      <span style="font-size:0.78rem;color:var(--text-muted)">${job.applicantsCount || 0} applied</span>
    </div>
  </div>`;
}

function buildNav() {
  const user = getUser();
  if (!user) return `
    <nav>
      <a class="logo" href="/index.html">Shift<span>ly</span></a>
      <div class="nav-links">
        <a href="/pages/jobs.html">Browse Shifts</a>
        <a href="/pages/login.html">Login</a>
        <a href="/pages/register.html" class="nav-cta">Sign Up</a>
      </div>
    </nav>`;
  if (user.role === 'student') return `
    <nav>
      <a class="logo" href="/index.html">Shift<span>ly</span></a>
      <div class="nav-links">
        <a href="/pages/jobs.html">Browse Shifts</a>
        <a href="/pages/student-dashboard.html">Dashboard</a>
        <a href="/pages/profile.html">Profile</a>
        <a href="#" onclick="logout()">Logout</a>
      </div>
    </nav>`;
  return `
    <nav>
      <a class="logo" href="/index.html">Shift<span>ly</span></a>
      <div class="nav-links">
        <a href="/pages/post-job.html">+ Post Shift</a>
        <a href="/pages/business-dashboard.html">Dashboard</a>
        <a href="/pages/profile.html">Profile</a>
        <a href="#" onclick="logout()">Logout</a>
      </div>
    </nav>`;
}
