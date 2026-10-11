# ✂️ The Royal Stitch — Master Tailor & Bespoke Clothier

> **A Full-Stack Bespoke Tailoring & Appointment Management Web Application**  
> Built with **Node.js**, **Express.js**, **MongoDB Atlas**, **Mongoose ODM**, **HTML5**, **CSS3**, and **Vanilla JavaScript**.

---

## 📖 Overview

**The Royal Stitch** is a digital bespoke tailoring atelier application. Designed with an opulent **Royal Burgundy (`#7B1F3A`)** and **Gold (`#C8952A`)** aesthetic, it bridges high-end craftsmanship with modern appointment scheduling and customer fitting profiles.

The platform handles the entire garment journey: from online consultation bookings and tailor accept/reject scheduling, to 17-point anatomical measurement profiles and printable workshop order slips.

---

## ✨ Key Features

### 1. 📅 Customer Appointment Scheduling & Slot Locking
- **Real-Time Collision Detection**: Prevents double bookings by checking already confirmed or pending appointments for any given date and time slot.
- **Dynamic Slot Availability**: Calls `GET /api/slots?date=YYYY-MM-DD` to dynamically calculate and display available 30-minute booking windows.

### 2. 🔍 Email-Based Live Status Tracking (No Login Required)
- Customers do not need to remember passwords or register accounts.
- By entering their email address in the **"Check Status"** modal, clients see live updates:
  - 🟡 **Pending Review**: Request is awaiting the master tailor's review.
  - 🟢 **Accepted & Confirmed**: Tailor accepted the booking with instructions on what to bring.
  - 🔴 **Rejected / Rescheduled**: Time slot unavailable; slot is automatically released back to the calendar.
  - 🔵 **Completed & Ready for Pickup**: Garment tailored, with working day collection timings.
- **Direct Tailor Notes**: Shows personalized guidance written by the tailor (e.g. *"Please bring sample tuxedo cloth"* or *"Ready for pickup on any working day Mon-Sat"*).

### 3. ✂️ Master Tailor Admin Portal (`/admin`)
- **Secure Authentication**: Session-based login backed by `connect-mongo` and `bcrypt` password hashing.
- **Real-Time KPI Dashboard**: Live counters for Total Messages, Pending Bookings, Confirmed Bookings, and Fitting Profiles.
- **Decision Engine**:
  - **Accept Appointment**: Locks slot and sends custom guidance note.
  - **Reject Appointment**: Attaches reason and automatically frees up the calendar slot for other clients.
  - **Complete Appointment**: Prompts for collection instructions and updates customer status.
- **1-Click WhatsApp Integration**: Generates pre-filled WhatsApp web links with client name, service, date, status, and tailor notes.

### 4. 📏 17-Point Bespoke Fitting Profiles & Workshop Slips
- Accessible only once an appointment is accepted (`confirmed`).
- Captures 17 precision body measurements:
  - **Upper Body**: Chest, Waist, Hips, Shoulders, Sleeve Length, Neck/Collar, Garment Length, Bicep, Cross Back, Wrist/Cuff.
  - **Lower Body**: Trouser Waist, Trouser Hips, Outseam Length, Inseam, Thigh, Knee, Bottom Opening.
  - **Preferences**: Fit Style (Slim, Regular, Relaxed, Traditional) & Units (Inches / Centimeters).
- **Printable Workshop Slips**: Generates a formatted work order slip with customer details, measurement specs, and master tailor signature line (`Ctrl + P` printable).

### 5. 🎨 Brand Identity & Custom Favicon
- Hand-crafted vector scissors (`favicon.svg`) badge matching the atelier's identity.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend Runtime** | Node.js (v18+) |
| **Web Framework** | Express.js 5.x |
| **Database** | MongoDB Atlas (Cloud Cluster) |
| **ODM / Modeling** | Mongoose v8.x |
| **Session Management** | Express-Session + Connect-Mongo |
| **Security & Hashing** | Bcrypt.js |
| **Frontend** | HTML5, CSS3 (Custom Variables, Flexbox/Grid), Vanilla JavaScript (ES6+) |
| **Typography & Icons** | Playfair Display, Lato, Font Awesome 6 |

---

## 📁 Project Structure

```
d:\Tejas\Tailor Aditya\
├── config/
│   └── db.js                 # Centralized MongoDB Atlas connection & auto-reconnect
├── models/
│   ├── Admin.js              # Admin credentials & password hashing schema
│   ├── Appointment.js        # Appointment model (service, date, slot, tailor note, status)
│   ├── Contact.js            # Customer contact inquiry schema
│   └── Measurement.js        # 17-point bespoke tailoring profile schema
├── public/
│   ├── admin.html            # Master Tailor Admin Dashboard (SPA)
│   └── favicon.svg           # Vector scissors favicon
├── .env                      # Environment variables (MongoDB URI, session secrets)
├── .env.example              # Template environment configuration
├── .gitignore                # Excludes node_modules, .env, and logs
├── favicon.svg               # Root brand favicon
├── index.html                # Client-facing responsive website & modals
├── package.json              # Project metadata & npm dependencies
├── package-lock.json         # Pinned dependency versions
├── script.js                 # Client-side form handlers & email status lookup
├── server.js                 # Express server & REST API routes
└── style.css                 # Luxury Burgundy & Gold stylesheet
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MongoDB Atlas** account (or local MongoDB instance)

### 2. Clone / Download
```bash
git clone <your-repository-url>
cd "Tailor Aditya"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and fill in your connection details:
```env
PORT=3000
SESSION_SECRET=your_super_secret_session_key
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.jlwbfvb.mongodb.net/royalstitch?retryWrites=true&w=majority
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 5. Run the Server
```bash
# Start server
node server.js

# Or start with nodemon (development)
npx nodemon server.js
```

### 6. Access the Application
- **Main Website**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)
  - **Username**: `admin`
  - **Password**: `admin123`

---

## 📡 REST API Reference

### Public Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/contact` | Submits customer inquiry message |
| `POST` | `/api/appointment` | Books an appointment with conflict checking |
| `GET` | `/api/slots?date=YYYY-MM-DD` | Returns available and booked time slots for a date |
| `GET` | `/api/appointment/status?email=...` | Public lookup for customers to check booking status |

### Protected Admin Endpoints (`requireAdmin`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/admin/login` | Authenticates tailor and establishes session |
| `POST` | `/api/admin/logout` | Destroys active admin session |
| `GET` | `/api/admin/me` | Verifies current admin session |
| `GET` | `/api/admin/stats` | Fetches aggregate KPI metrics |
| `GET` | `/api/admin/appointments` | Lists appointments (supports `?status=...`) |
| `PATCH` | `/api/admin/appointments/:id` | Updates appointment status (`confirmed`, `cancelled`, `completed`) & tailor note |
| `DELETE`| `/api/admin/appointments/:id` | Deletes appointment record |
| `GET` | `/api/admin/measurements` | Lists customer bespoke fitting profiles |
| `POST` | `/api/admin/measurements` | Creates new 17-point measurement profile |
| `GET` | `/api/admin/measurements/:id` | Fetches individual measurement profile |
| `PUT` | `/api/admin/measurements/:id` | Updates measurement profile |
| `DELETE`| `/api/admin/measurements/:id` | Deletes measurement profile |

---

## 🔒 Security Best Practices
- **Credentials Protected**: Passwords hashed using `bcrypt` with salt rounds.
- **Environment Isolation**: `.env` is strictly git-ignored to prevent credential leaks.
- **Regex Injection Prevention**: Email and search queries sanitize special regex characters before executing database queries.
- **Session Security**: Cookies set with `httpOnly: true` and `sameSite: 'lax'`.

---

## 📄 License
This project is licensed under the **ISC License**.

Crafted with passion & precision for **The Royal Stitch — Master Tailor**.
