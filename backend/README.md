# Daily Drop Commercial Kitchens - Backend API (Node.js + Express + MongoDB)

Production-grade **MVC (Model-View-Controller)** backend developed for **Daily Drop Commercial Kitchens & Storage** in Victoria Park, Perth, WA.

---

## 🏗️ Architecture Overview: MVC (Model-View-Controller)

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js             # Mongoose connection (MongoDB Atlas / Local / In-Memory fallback)
│   │   └── constants.js      # Perth AWST timezone, ATO business credentials, rental rates
│   ├── models/               # [M]odels (Mongoose MongoDB Schemas)
│   │   ├── User.js           # Hirers, Staff Admins, Super Admin Directors (bcrypt + JWT)
│   │   ├── Booking.js        # Commercial kitchen shift reservations
│   │   ├── StorageBooking.js # Commercial storage bay leases (Dry Unit A & Cold Unit B)
│   │   ├── Invoice.js        # Official ATO Tax Invoices, 10% GST, & Escrow Bonds
│   │   ├── BlockedSlot.js    # Facility sanitization & maintenance windows
│   │   ├── KitchenConfig.js  # Rental rates ($38/hr + GST, 4h min) & operating hours
│   │   └── Enquiry.js        # Hirer contact enquiries & consultation requests
│   ├── controllers/          # [C]ontrollers (Business Logic & Request Handling)
│   │   ├── authController.js    # Customer signup, login, profile, user bookings
│   │   ├── bookingController.js # Rate calculation, hourly availability, shift creation
│   │   ├── storageController.js # Commercial storage bay lease management
│   │   ├── invoiceController.js # Tax invoice generator, ATO breakdown, AI risk scoring
│   │   ├── adminController.js   # Staff & Super Admin authentication, approval workflows
│   │   └── enquiryController.js # Enquiry submission & status tracking
│   ├── routes/               # [R]outes (Express REST Endpoints)
│   │   ├── authRoutes.js        # /api/auth/*
│   │   ├── bookingRoutes.js     # /api/bookings, /api/availability, /api/config
│   │   ├── storageRoutes.js     # /api/storage-bookings/*
│   │   ├── invoiceRoutes.js     # /api/invoices/*
│   │   ├── adminRoutes.js       # /api/admin/* and /api/superadmin/*
│   │   ├── enquiryRoutes.js     # /api/enquiries/*
│   │   └── index.js             # Master API router mounting all modules
│   ├── middlewares/          # Security, Auth & Error Handling
│   │   ├── authMiddleware.js    # JWT token verification & role enforcement
│   │   └── errorMiddleware.js   # Centralized error handler with clean JSON responses
│   ├── services/             # Integrations
│   │   ├── googleSheetService.js # Two-way real-time Google Sheets webhook synchronization
│   │   └── geminiService.js     # Google Gemini 2.5 Flash Autonomous Financial Watchdog
│   ├── utils/                # Utilities & Seeding
│   │   ├── dateUtils.js         # Strict Australia/Perth (AWST · UTC+8) date standardization
│   │   └── seedData.js          # Pre-populates database with demo users, bookings & storage bays
│   └── server.js             # Express app bootstrap, CORS, middlewares & server listener
├── .env.example              # Environment variables template
├── .env                      # Local environment configuration
├── package.json              # Project dependencies and npm scripts
└── README.md
```

---

## 🇦🇺 Australian Commercial Standards & Real-World Features

1. **Perth Timezone (`Australia/Perth` · AWST · UTC+8)**:
   - All booking shifts, calendar slots, and audit logs are strictly standardized into Perth local time.
2. **ATO Official Tax Invoicing & Compliance**:
   - Registered Business: **Daily Drop Commercial Kitchens Pty Ltd**
   - ABN: **51 824 753 556**
   - Australian GST: Automatically calculates **10% GST** on all rental fees.
   - PayID & Direct Banking: NAB BSB `066-000` / Account `1234 5678` / PayID `hello@dailydrop.today`.
3. **Escrow Security Bonds Protection**:
   - $750.00 refundable kitchen security bond.
   - $200.00 refundable storage security bond.
4. **Google Workspace & Google Sheets Webhook Sync**:
   - Every booking created on the website is sent in real-time to Daily Drop's central Google Sheet.
   - Updates from admin portals sync back to Google Sheets automatically.
5. **Autonomous AI Financial Watchdog (Google Gemini API)**:
   - Evaluates 48-hour provisional holds.
   - Flags upcoming unpaid shifts within 24 hours as **High Risk / Action Required**.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment (`.env`)
Copy `.env.example` to `.env`:
```env
PORT=8000
MONGODB_URI=mongodb://127.0.0.1:27017/dailydrop_kitchen
JWT_SECRET=dailydrop_commercial_kitchen_jwt_secret_perth_2026_super_secure_key
GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbwdQXMwtOl_YpDxnG2swx8dxKjQGTR5pfJuLqicmpJJYYVx4AeAtsj8yaMynxCGbdG_MA/exec
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: If local MongoDB is not running, the system will automatically start an in-memory MongoDB instance for seamless local testing).*

### 3. Seed Database
```bash
npm run seed
```
Creates default admin accounts, initial kitchen bookings (Michael Davies, Rohit), and commercial storage leases.

### 4. Start the Server
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

API will be live at: `http://localhost:8000`  
Health check: `http://localhost:8000/api/health`

---

## 🔐 Default Credentials for Testing

| Role | Username / Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Hirer (Customer)** | `rratnaparkhi3@gmail.com` | `kitchen123` | Customer Portal & Shift History |
| **Demo Hirer** | `demo@dailydrop.today` | `kitchen123` | Customer Portal & Shift History |
| **Staff Admin** | `admin` | `kitchen2026` | Operations Dashboard & Shift Approvals |
| **Super Admin Director** | `superadmin` | `director2026` | Financial Monitor, ATO Invoices & AI Watchdog |

---

## 🌐 Connecting with MongoDB Atlas (Cloud Production)

For deployment to cloud servers (Render, Railway, AWS, DigitalOcean):
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Connect** &rarr; **Drivers** &rarr; Copy the connection string:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/dailydrop_kitchen?retryWrites=true&w=majority
   ```
3. Paste it into your production environment variables.
