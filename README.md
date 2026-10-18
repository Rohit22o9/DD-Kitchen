# Daily Drop — Commercial Kitchen Hourly Rental Platform

> **“Your Kitchen. Your Hours. Your Business.”**

A hyper-modern, premium, responsive web application for **Daily Drop**, enabling food businesses, cloud kitchens, caterers, food entrepreneurs, and artisan bakers to discover commercial kitchen facilities, select hourly slots, view transparent pricing, and submit booking requests.

---

## 🍳 Platform Overview

Daily Drop provides certified commercial kitchen infrastructure for rent on a flexible, hourly basis.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy ORM (SQLite / PostgreSQL support), JWT Authentication.
- **Official Brand Design**: Built preserving Daily Drop's exact brand colors (Forest Green `#264329`, Vibrant Orange `#ED8533`, Soft Mint `#EBF5EE`, Off-white `#FAFCF9`) and official logo.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24)
- **Python**: v3.10+ (tested on v3.11)

### 2. Backend Setup & Startup
```bash
# Navigate to the project root
cd "Daily Drop Kitchen"

# Initialize & seed database with realistic bookings and admin credentials
python -m backend.seed

# Start the FastAPI server on port 8000
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
The API documentation is accessible at:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### 3. Frontend Setup & Startup
In a separate terminal window:
```bash
cd "Daily Drop Kitchen/frontend"

# Install dependencies (already installed)
npm install

# Start Vite dev server on port 5173
npm run dev
```
Open **[http://127.0.0.1:5173](http://127.0.0.1:5173)** in your browser.

---

## 🔐 Staff & Admin Management Portal

An integrated operations portal is built into the application:
- Click **"Staff Login"** in the top navigation bar or the footer link.
- **Username**: `admin`
- **Password**: `admin123`

### Features in the Admin Portal:
1. **Live Analytics**: Total Bookings, Pending Reviews, Confirmed Revenue, Active Rental Hours, Customer Enquiries.
2. **Booking Management**: Filter by status (`Pending`, `Approved`, `Confirmed`, `Completed`, `Rejected`). Search by name, brand, or reference code.
3. **One-Click Actions**: Approve request, Confirm booking, Record payments (`Unpaid`, `Deposit Paid`, `Paid in Full`), and add administrative inspection notes.
4. **Kitchen Settings**: Dynamically update the base hourly rate, minimum rental hours, daily operating hours (e.g., 06:00 to 23:00), cleaning fee, and security deposit. Updates apply immediately to customer rate calculators.
5. **Maintenance & Blocked Slots**: Schedule maintenance, deep sanitation, or private production blocks that lock out customer booking.
6. **Customer Enquiries**: View and manage incoming custom rental queries.

---

## 💡 Key Architectural Highlights

1. **Conflict & Overlap Prevention**:
   - Client and server validate that requested time slots do not overlap with existing confirmed or pending reservations.
   - Restricts bookings to configured daily operating hours (06:00 – 23:00).
   - Enforces minimum duration rules (minimum 2 hours).

2. **Transparent Dynamic Pricing Formula**:
   $$\text{Total Cost} = (\text{Selected Hours} \times \text{Hourly Rate}) + \text{Cleaning Fee}$$
   *(Plus refundable security deposit authorized prior to check-in).*

3. **Status Distinction**:
   - Clearly distinguishes a **Booking Request** from a **Confirmed Reservation**.
   - Displays clear notice: *"Your booking request has been received. Our team will contact you to confirm availability and payment."*

4. **Calendar Integration**:
   - Generates and downloads native `.ics` calendar files with session times, location, and reference codes for Google Calendar, Apple Calendar, and Outlook.

---

## 🏢 Facility Information (Perth Hub 1)
- **Address**: 876 Albany Hwy, East Victoria Park, Perth WA 6101
- **Phone**: +61 472 701 922
- **Email**: kitchens@dailydrop.com.au
- **Operating Hours**: 06:00 AM – 11:00 PM AWST Daily
