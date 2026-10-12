// ================================================
//  THE ROYAL STITCH — server.js  (Main Backend)
//  Stack: Node.js + Express.js + MongoDB Atlas (Mongoose)
// ================================================

require('dotenv').config();
const express      = require('express');
const session      = require('express-session');
const MongoStore   = require('connect-mongo');
const cors         = require('cors');
const path         = require('path');
const bcrypt       = require('bcryptjs');
const mongoose     = require('mongoose');

const connectDB    = require('./config/db');
const Contact      = require('./models/Contact');
const Appointment  = require('./models/Appointment');
const Admin        = require('./models/Admin');
const Measurement  = require('./models/Measurement');

const app  = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// ── Connect to MongoDB Atlas ──────────────────────
let isDbConnected = false;

connectDB().then(connected => {
  isDbConnected = connected;
  if (connected) {
    seedDefaultAdmin();
  }
});

// Seed default admin if not exists
async function seedDefaultAdmin() {
  try {
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    
    const existing = await Admin.findOne({ username: adminUser.toLowerCase() });
    if (!existing) {
      const hash = bcrypt.hashSync(adminPass, 10);
      await Admin.create({
        username: adminUser.toLowerCase(),
        password_hash: hash
      });
      console.log(`✅ Default admin created in MongoDB Atlas → username: ${adminUser} | password: ${adminPass}`);
    }
  } catch (err) {
    console.error('Error seeding admin user:', err.message);
  }
}

// ── Session store configuration ───────────────────
const sessionSecret = process.env.SESSION_SECRET || 'tailor_royal_stitch_secret_2026';
const sessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 4, // 4 hours
    httpOnly: true,
    sameSite: 'lax'
  }
};

// Use MongoStore for persistent sessions if MongoDB URI is configured
if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('<username>') && !process.env.MONGODB_URI.includes('<db_username>') && !process.env.MONGODB_URI.includes('<password>')) {
  sessionOptions.store = MongoStore.create({
    clientPromise: new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        return resolve(mongoose.connection.getClient());
      }
      mongoose.connection.once('connected', () => {
        resolve(mongoose.connection.getClient());
      });
    }),
    collectionName: 'sessions',
    ttl: 60 * 60 * 4 // 4 hours
  });
}

// ── Middleware ────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionOptions));

// Database availability check middleware for API routes
function checkDB(req, res, next) {
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  return res.status(503).json({
    success: false,
    message: 'Database is connecting or not yet configured. Please set a valid MONGODB_URI in your .env file.'
  });
}

// Serve public static assets
app.use(express.static(path.join(__dirname)));            // index.html, style.css, script.js
app.use(express.static(path.join(__dirname, 'public')));  // admin.html

// ── Auth middleware ───────────────────────────────
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ success: false, message: 'Unauthorised. Please login.' });
}

// ================================================
//  PUBLIC API ROUTES
// ================================================

// POST /api/contact — save contact form submission
app.post('/api/contact', checkDB, async (req, res) => {
  try {
    const { name, phone, email, service, message } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required.' });
    }

    const contact = await Contact.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      service: service ? service.trim() : '',
      message: message ? message.trim() : '',
      status: 'new'
    });

    console.log(`📬 New contact inquiry from ${name} (${phone})`);
    res.json({
      success: true,
      message: 'Thank you! We will contact you soon.',
      id: contact.id
    });
  } catch (err) {
    console.error('Error creating contact:', err);
    res.status(500).json({ success: false, message: 'Server error saving contact.' });
  }
});

// POST /api/appointment — book an appointment
app.post('/api/appointment', checkDB, async (req, res) => {
  try {
    const { name, phone, email, service, date, time_slot, notes } = req.body;

    if (!name || !phone || !email || !service || !date || !time_slot) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, email, service, date, and time are required.'
      });
    }

    // Check if slot already taken on this date
    const conflict = await Appointment.findOne({
      date: date.trim(),
      time_slot: time_slot.trim(),
      status: { $ne: 'cancelled' }
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked. Please choose another.'
      });
    }

    const appointment = await Appointment.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      service: service.trim(),
      date: date.trim(),
      time_slot: time_slot.trim(),
      notes: notes ? notes.trim() : '',
      status: 'pending'
    });

    console.log(`📅 New appointment booked: ${name} (${appointment.email}) on ${date} at ${time_slot}`);
    res.json({
      success: true,
      message: `Appointment booked for ${date} at ${time_slot}!`,
      id: appointment.id
    });
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ success: false, message: 'Server error booking appointment.' });
  }
});

// GET /api/slots?date=YYYY-MM-DD — get available time slots
app.get('/api/slots', checkDB, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required.' });
    }

    const ALL_SLOTS = [
      '09:00 AM','09:30 AM','10:00 AM','10:30 AM',
      '11:00 AM','11:30 AM','12:00 PM','12:30 PM',
      '02:00 PM','02:30 PM','03:00 PM','03:30 PM',
      '04:00 PM','04:30 PM','05:00 PM','05:30 PM',
      '06:00 PM','06:30 PM','07:00 PM'
    ];

    const bookedAppointments = await Appointment.find({
      date: date.trim(),
      status: { $ne: 'cancelled' }
    }).select('time_slot');

    const booked = bookedAppointments.map(a => a.time_slot);
    const available = ALL_SLOTS.filter(slot => !booked.includes(slot));

    res.json({ success: true, date, available, booked });
  } catch (err) {
    console.error('Error retrieving slots:', err);
    res.status(500).json({ success: false, message: 'Error retrieving slots.' });
  }
});

// GET /api/appointment/status?email=... — public lookup for customers to check booking status via email
app.get('/api/appointment/status', checkDB, async (req, res) => {
  try {
    const { email, phone } = req.query;
    const lookupEmail = email ? email.trim() : '';
    const lookupPhone = phone ? phone.trim() : '';

    if (!lookupEmail && !lookupPhone) {
      return res.status(400).json({ success: false, message: 'Please provide your email address.' });
    }

    let query = {};
    if (lookupEmail) {
      query.email = { $regex: new RegExp(`^${lookupEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    } else {
      query.phone = lookupPhone;
    }

    const appointments = await Appointment.find(query).sort({ created_at: -1 });

    res.json({
      success: true,
      data: appointments.map(a => ({
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone,
        service: a.service,
        date: a.date,
        time_slot: a.time_slot,
        status: a.status,
        tailor_note: a.tailor_note || '',
        created_at: a.created_at ? new Date(a.created_at).toLocaleString() : ''
      }))
    });
  } catch (err) {
    console.error('Error fetching appointment status:', err);
    res.status(500).json({ success: false, message: 'Could not fetch appointment status.' });
  }
});

// ================================================
//  ADMIN AUTH ROUTES
// ================================================

// POST /api/admin/login
app.post('/api/admin/login', checkDB, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required.' });
    }

    const admin = await Admin.findOne({ username: username.trim().toLowerCase() });
    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    req.session.isAdmin = true;
    req.session.username = admin.username;
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ success: false, message: 'Could not establish session.' });
      }
      res.json({ success: true, message: 'Logged in successfully.' });
    });
  } catch (err) {
    console.error('Error during admin login:', err);
    res.status(500).json({ success: false, message: 'Login error.' });
  }
});

// POST /api/admin/logout
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false, message: 'Could not log out.' });
    res.json({ success: true, message: 'Logged out.' });
  });
});

// GET /api/admin/me — check session status
app.get('/api/admin/me', (req, res) => {
  if (req.session && req.session.isAdmin) {
    res.json({ success: true, username: req.session.username });
  } else {
    res.status(401).json({ success: false, message: 'Not authenticated' });
  }
});

// ================================================
//  ADMIN DATA ROUTES (Protected)
// ================================================

// GET /api/admin/contacts — list customer messages
app.get('/api/admin/contacts', requireAdmin, checkDB, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    const rows = await Contact.find(filter).sort({ created_at: -1 });

    res.json({
      success: true,
      data: rows.map(r => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        email: r.email,
        service: r.service,
        message: r.message,
        status: r.status,
        created_at: r.created_at ? new Date(r.created_at).toLocaleString() : ''
      })),
      total: rows.length
    });
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
});

// PATCH /api/admin/contacts/:id — update contact status
app.patch('/api/admin/contacts/:id', requireAdmin, checkDB, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }
    res.json({ success: true, message: 'Contact updated.', data: updated });
  } catch (err) {
    console.error('Error updating contact:', err);
    res.status(500).json({ success: false, message: 'Failed to update contact.' });
  }
});

// DELETE /api/admin/contacts/:id — delete contact
app.delete('/api/admin/contacts/:id', requireAdmin, checkDB, async (req, res) => {
  try {
    const deleted = await Contact.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }
    res.json({ success: true, message: 'Contact deleted.' });
  } catch (err) {
    console.error('Error deleting contact:', err);
    res.status(500).json({ success: false, message: 'Failed to delete contact.' });
  }
});

// GET /api/admin/appointments — list appointments
app.get('/api/admin/appointments', requireAdmin, checkDB, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    const rows = await Appointment.find(filter).sort({ created_at: -1 });

    res.json({
      success: true,
      data: rows.map(r => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        email: r.email,
        service: r.service,
        date: r.date,
        time_slot: r.time_slot,
        notes: r.notes,
        tailor_note: r.tailor_note || '',
        status: r.status,
        created_at: r.created_at ? new Date(r.created_at).toLocaleString() : ''
      })),
      total: rows.length
    });
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments.' });
  }
});

// PATCH /api/admin/appointments/:id — update appointment status & tailor note
app.patch('/api/admin/appointments/:id', requireAdmin, checkDB, async (req, res) => {
  try {
    const { status, tailor_note } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (tailor_note !== undefined) updateData.tailor_note = tailor_note.trim();

    const updated = await Appointment.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    res.json({ success: true, message: `Appointment marked as ${status || 'updated'}.`, data: updated });
  } catch (err) {
    console.error('Error updating appointment:', err);
    res.status(500).json({ success: false, message: 'Failed to update appointment.' });
  }
});

// DELETE /api/admin/appointments/:id — delete appointment
app.delete('/api/admin/appointments/:id', requireAdmin, checkDB, async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    res.json({ success: true, message: 'Appointment deleted.' });
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.status(500).json({ success: false, message: 'Failed to delete appointment.' });
  }
});

// ================================================
//  ADMIN MEASUREMENTS & FITTING PROFILES ROUTES
// ================================================

// GET /api/admin/measurements — list/search measurement profiles
app.get('/api/admin/measurements', requireAdmin, checkDB, async (req, res) => {
  try {
    const { search, garment_type } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { customer_name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    if (garment_type && garment_type !== 'all') {
      filter.garment_type = garment_type;
    }

    const rows = await Measurement.find(filter).sort({ updated_at: -1 });

    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  } catch (err) {
    console.error('Error fetching measurements:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch measurements.' });
  }
});

// GET /api/admin/measurements/:id — get single measurement profile
app.get('/api/admin/measurements/:id', requireAdmin, checkDB, async (req, res) => {
  try {
    const profile = await Measurement.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Measurement profile not found.' });
    }
    res.json({ success: true, data: profile });
  } catch (err) {
    console.error('Error fetching single measurement:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch measurement profile.' });
  }
});

// POST /api/admin/measurements — create new measurement profile
app.post('/api/admin/measurements', requireAdmin, checkDB, async (req, res) => {
  try {
    const {
      customer_name, phone, email, garment_type, unit, fit_preference, notes,
      chest, waist, hip, shoulder, sleeve_length, neck_collar, garment_length,
      cross_back, bicep, wrist, trouser_waist, trouser_hip, trouser_length,
      inseam, thigh, knee, bottom_opening
    } = req.body;

    if (!customer_name || !phone) {
      return res.status(400).json({ success: false, message: 'Customer name and phone number are required.' });
    }

    const profile = await Measurement.create({
      customer_name: customer_name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      garment_type: garment_type ? garment_type.trim() : 'Bespoke Suit',
      unit: unit || 'inches',
      fit_preference: fit_preference || 'Slim Fit',
      notes: notes ? notes.trim() : '',
      chest, waist, hip, shoulder, sleeve_length, neck_collar, garment_length,
      cross_back, bicep, wrist, trouser_waist, trouser_hip, trouser_length,
      inseam, thigh, knee, bottom_opening
    });

    res.status(201).json({
      success: true,
      message: 'Measurement profile created successfully.',
      data: profile,
      id: profile.id
    });
  } catch (err) {
    console.error('Error creating measurement profile:', err);
    res.status(500).json({ success: false, message: 'Failed to create measurement profile.' });
  }
});

// PUT /api/admin/measurements/:id — update measurement profile
app.put('/api/admin/measurements/:id', requireAdmin, checkDB, async (req, res) => {
  try {
    req.body.updated_at = new Date();
    const updated = await Measurement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Measurement profile not found.' });
    }
    res.json({
      success: true,
      message: 'Measurement profile updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('Error updating measurement profile:', err);
    res.status(500).json({ success: false, message: 'Failed to update measurement profile.' });
  }
});

// DELETE /api/admin/measurements/:id — delete measurement profile
app.delete('/api/admin/measurements/:id', requireAdmin, checkDB, async (req, res) => {
  try {
    const deleted = await Measurement.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Measurement profile not found.' });
    }
    res.json({ success: true, message: 'Measurement profile deleted successfully.' });
  } catch (err) {
    console.error('Error deleting measurement profile:', err);
    res.status(500).json({ success: false, message: 'Failed to delete measurement profile.' });
  }
});

// GET /api/admin/stats — dashboard counts
app.get('/api/admin/stats', requireAdmin, checkDB, async (req, res) => {
  try {
    const [
      totalContacts,
      newContacts,
      readContacts,
      totalAppts,
      pendingAppts,
      confirmedAppts,
      cancelledAppts,
      completedAppts,
      totalMeasurements
    ] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'new' }),
      Contact.countDocuments({ status: 'read' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'confirmed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.countDocuments({ status: 'completed' }),
      Measurement.countDocuments()
    ]);

    res.json({
      success: true,
      stats: {
        contacts: {
          total: totalContacts,
          new: newContacts,
          read: readContacts
        },
        appointments: {
          total: totalAppts,
          pending: pendingAppts,
          confirmed: confirmedAppts,
          cancelled: cancelledAppts,
          completed: completedAppts
        },
        measurements: {
          total: totalMeasurements
        }
      }
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ success: false, message: 'Failed to calculate stats.' });
  }
});

// ── Admin panel SPA fallback ──────────────────────
app.get(['/admin', '/admin/{*path}'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ── Server Start ──────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🧵 The Royal Stitch — Full Stack Website Running!`);
  console.log(`   Website  →  http://localhost:${PORT}`);
  console.log(`   Admin    →  http://localhost:${PORT}/admin`);
  console.log(`   API      →  http://localhost:${PORT}/api\n`);
});
