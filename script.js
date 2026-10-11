/* ================================================
   THE ROYAL STITCH — script.js
   Connects frontend → Express backend API
   ================================================ */

const API = '';   // same origin (served by server.js)

/* ── Navbar: scroll shrink + active link ── */
const navbar    = document.getElementById('navbar');
const navLinks  = document.getElementById('navLinks');
const navToggle = document.getElementById('navToggle');
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
  backToTop.classList.toggle('visible', window.scrollY > 400);

  const sections = document.querySelectorAll('section[id]');
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 110) current = sec.id;
  });
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
  });
});

/* ── Mobile hamburger ── */
navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.innerHTML = open ? '<i class="fa fa-times"></i>' : '<i class="fa fa-bars"></i>';
  document.body.style.overflow = open ? 'hidden' : '';
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.innerHTML = '<i class="fa fa-bars"></i>';
    document.body.style.overflow = '';
  });
});

/* ── Back to top ── */
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ── Scroll-reveal ── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('revealed'); revealObserver.unobserve(entry.target); }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .gallery-item, .pricing-card, .testimonial-card, .feature, .contact-item').forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = `${i * 60}ms`;
  revealObserver.observe(el);
});

/* ── Gallery lightbox ── */
document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const bgUrl = item.style.backgroundImage.replace(/url\(["']?|["']?\)/g, '');
    const label = item.querySelector('.gallery-overlay span')?.textContent || '';
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;cursor:zoom-out;padding:1rem;';
    overlay.innerHTML = `
      <img src="${bgUrl}" alt="${label}" style="max-width:90vw;max-height:78vh;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.6);object-fit:contain;"/>
      <p style="color:#E5B84D;font-family:'Playfair Display',serif;font-size:1.1rem;">${label}</p>
      <button style="background:transparent;border:1px solid rgba(255,255,255,.3);color:rgba(255,255,255,.65);padding:.5rem 1.8rem;border-radius:4px;cursor:pointer;">✕ Close</button>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    overlay.style.opacity = '0';
    requestAnimationFrame(() => { overlay.style.transition = 'opacity .25s'; overlay.style.opacity = '1'; });
    const close = () => { overlay.style.opacity = '0'; setTimeout(() => { overlay.parentNode && document.body.removeChild(overlay); document.body.style.overflow = ''; }, 250); };
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('button').addEventListener('click', close);
    document.addEventListener('keydown', function h(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', h); } });
  });
});

/* ================================================
   CONTACT FORM  →  POST /api/contact
   ================================================ */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Sending…';
    btn.disabled = true;

    const body = {
      name:    contactForm.querySelector('#name').value,
      phone:   contactForm.querySelector('#phone').value,
      email:   contactForm.querySelector('#email').value,
      service: contactForm.querySelector('#service').value,
      message: contactForm.querySelector('#message').value,
    };

    try {
      const res  = await fetch(`${API}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();

      if (data.success) {
        btn.innerHTML = '<i class="fa fa-check"></i> Message Sent!';
        btn.style.background = '#2e7d32'; btn.style.borderColor = '#2e7d32';
        contactForm.reset();
        setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; btn.style.borderColor = ''; btn.disabled = false; }, 3500);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      btn.innerHTML = '<i class="fa fa-times"></i> ' + (err.message || 'Failed. Try again.');
      btn.style.background = '#c62828'; btn.style.borderColor = '#c62828';
      setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; btn.style.borderColor = ''; btn.disabled = false; }, 3500);
    }
  });
}

/* ================================================
   APPOINTMENT BOOKING MODAL
   ================================================ */
function openAppointmentModal() {
  const statusModal = document.getElementById('statusModal');
  if (statusModal) statusModal.style.display = 'none';
  const apptModal = document.getElementById('apptModal');
  if (apptModal) apptModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  // Set min date to today
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('apptDate');
  if (dateInput) dateInput.min = today;
}
function closeAppointmentModal() {
  const apptModal = document.getElementById('apptModal');
  if (apptModal) apptModal.style.display = 'none';
  document.body.style.overflow = '';
}

// Load available slots when date changes
const apptDate = document.getElementById('apptDate');
if (apptDate) {
  apptDate.addEventListener('change', async () => {
    const date = apptDate.value;
    const slotSelect = document.getElementById('apptSlot');
    slotSelect.innerHTML = '<option value="">Loading slots…</option>';
    slotSelect.disabled = true;

    try {
      const res  = await fetch(`${API}/api/slots?date=${date}`);
      const data = await res.json();
      slotSelect.innerHTML = '<option value="" disabled selected>Pick a time slot</option>';
      if (data.available.length === 0) {
        slotSelect.innerHTML += '<option disabled>No slots available this day</option>';
      } else {
        data.available.forEach(slot => {
          slotSelect.innerHTML += `<option value="${slot}">${slot}</option>`;
        });
      }
      slotSelect.disabled = false;
    } catch {
      slotSelect.innerHTML = '<option disabled>Error loading slots</option>';
    }
  });
}

const apptForm = document.getElementById('apptForm');
if (apptForm) {
  apptForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn  = apptForm.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Booking…';
    btn.disabled = true;

    const body = {
      name:      document.getElementById('apptName').value,
      phone:     document.getElementById('apptPhone').value,
      email:     document.getElementById('apptEmail').value,
      service:   document.getElementById('apptService').value,
      date:      document.getElementById('apptDate').value,
      time_slot: document.getElementById('apptSlot').value,
      notes:     document.getElementById('apptNotes').value,
    };

    try {
      const res  = await fetch(`${API}/api/appointment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();

      if (data.success) {
        document.getElementById('apptSuccess').style.display = 'block';
        document.getElementById('apptSuccess').textContent   = '✅ ' + data.message;
        apptForm.reset();
        setTimeout(closeAppointmentModal, 3000);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      document.getElementById('apptError').style.display  = 'block';
      document.getElementById('apptError').textContent    = '❌ ' + (err.message || 'Booking failed. Try again.');
    }

    btn.innerHTML = orig; btn.disabled = false;
  });
}

/* ================================================
   CUSTOMER APPOINTMENT STATUS LOOKUP
   ================================================ */
function openStatusModal() {
  const apptModal = document.getElementById('apptModal');
  if (apptModal) apptModal.style.display = 'none';
  const statusModal = document.getElementById('statusModal');
  if (statusModal) statusModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeStatusModal() {
  const statusModal = document.getElementById('statusModal');
  if (statusModal) statusModal.style.display = 'none';
  document.body.style.overflow = '';
}

// Close modals when clicking on background backdrop
window.addEventListener('click', (e) => {
  const apptModal = document.getElementById('apptModal');
  const statusModal = document.getElementById('statusModal');
  if (e.target === apptModal) closeAppointmentModal();
  if (e.target === statusModal) closeStatusModal();
});

async function checkCustomerStatus(e) {
  e.preventDefault();
  const email = (document.getElementById('statusEmail').value || '').trim();
  const container = document.getElementById('statusResults');
  container.innerHTML = '<div style="text-align:center;padding:1rem;color:#6b7280;"><i class="fa fa-spinner fa-spin"></i> Checking your bookings…</div>';

  try {
    const res = await fetch(`${API}/api/appointment/status?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (!data.success || !data.data || data.data.length === 0) {
      container.innerHTML = `
        <div style="background:#fef2f2;border:1px solid #fee2e2;border-radius:8px;padding:1rem;color:#b91c1c;font-size:0.88rem;text-align:center;">
          No bookings found for <strong>${email}</strong>. Please check your email address or book a new appointment.
        </div>
      `;
      return;
    }

    container.innerHTML = data.data.map(a => {
      let badge = '';
      let desc = '';
      if (a.status === 'pending') {
        badge = '<span style="background:rgba(230,81,0,.15);color:#e65100;font-weight:700;padding:.25rem .7rem;border-radius:20px;font-size:.78rem;">🟡 Pending Review</span>';
        desc = 'Your appointment request is awaiting confirmation from Master Tailor Aditya.';
      } else if (a.status === 'confirmed') {
        badge = '<span style="background:rgba(46,125,50,.15);color:#2e7d32;font-weight:700;padding:.25rem .7rem;border-radius:20px;font-size:.78rem;">🟢 Accepted &amp; Confirmed</span>';
        desc = 'Your appointment has been accepted! Please arrive on time at our boutique.';
      } else if (a.status === 'cancelled') {
        badge = '<span style="background:rgba(198,40,40,.15);color:#c62828;font-weight:700;padding:.25rem .7rem;border-radius:20px;font-size:.78rem;">🔴 Rejected / Rescheduled</span>';
        desc = 'This appointment could not be accommodated. Please pick an alternative date or slot.';
      } else if (a.status === 'completed') {
        badge = '<span style="background:rgba(26,42,74,.15);color:#1A2A4A;font-weight:700;padding:.25rem .7rem;border-radius:20px;font-size:.78rem;">🔵 Completed &amp; Ready for Pickup</span>';
        desc = 'Your tailored order is complete! Please come and collect it on any working day.';
      }

      return `
        <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;padding:1rem;margin-bottom:0.8rem;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem;">
            <div>
              <strong style="font-size:0.95rem;color:#1A2A4A;">${a.service}</strong>
              <div style="font-size:0.82rem;color:#6b7280;margin-top:2px;">
                <i class="fa fa-calendar"></i> ${a.date} &nbsp;·&nbsp; <i class="fa fa-clock"></i> ${a.time_slot}
              </div>
            </div>
            ${badge}
          </div>
          <p style="font-size:0.82rem;color:#4b5563;margin:.4rem 0;">${desc}</p>
          ${a.tailor_note ? `
            <div style="background:#FDF6EC;border-left:3px solid #C8952A;padding:.5rem .7rem;font-size:0.8rem;color:#7B1F3A;border-radius:0 4px 4px 0;margin-top:.4rem;">
              <strong>Note from Tailor:</strong> ${a.tailor_note}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = '<div style="color:#c62828;text-align:center;padding:1rem;">Failed to fetch status. Please try again.</div>';
  }
}


