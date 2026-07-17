# 🚀 Clean Toilet Portal (PWMS) - Smart City Public Washroom Complaint System Backend API

![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-v4.19-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-v8.0%2B-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Dual--Engine-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)
![JWT Auth](https://img.shields.io/badge/Security-JWT%20RBAC-d63384?style=for-the-badge)

A state-of-the-art **Public Washroom Management & Complaint Portal (PWMS)** REST API Backend built for smart city municipal corporations. It enables citizens to locate clean public washrooms, report unhygienic or damaged facilities, and allows municipal authorities to track, assign, verify, and resolve issues efficiently using AI-powered vision grading and real-time operations dashboards.

---

## ✨ Enterprise Features & Architectural Highlights

- 🏢 **20 Comprehensive Civic Modules**: Covers every aspect of civic washroom management, from citizen complaints to staff biometrics and ward supervisor verification.
- 🗄️ **35 Relational Database Tables**: Fully normalized SQL schema supporting complex real-world municipal hierarchies (`States` $\rightarrow$ `Cities` $\rightarrow$ `Wards` $\rightarrow$ `Areas` $\rightarrow$ `Washrooms`).
- 🔄 **Dual-Engine Automatic Query Translation (`MySQL` + `SQLite`)**: Our custom abstraction (`config/db.js`) connects to **MySQL (`mysql2`)** in production and seamlessly falls back to disk-backed **SQLite (`sql.js`)** offline, dynamically translating `DATETIME intervals`, `AUTO_INCREMENT`, and `FOREIGN_KEY_CHECKS`.
- 🤖 **AI Vision Cleanliness & Damage Engine (`/api/ai`)**: Automated image analysis grading washroom cleanliness (`0-100 score`) and detecting infrastructure damage (`Feces`, `Overflowing bin`, `Broken tap`). Includes an NLP Chat & Priority classifier.
- 📱 **QR Code Scanning & Catalog (`/api/qr`)**: Generate and scan physical washroom QR codes (`QR-WASH-101`) for instant location identification and one-tap complaint submission.
- 🔒 **Role-Based Access Control (RBAC)**: Secure JWT authentication supporting `CITIZEN`, `STAFF`, `SUPERVISOR`, `ADMIN`, and `SUPER_ADMIN` roles with fine-grained permissions.
- 📊 **Multi-Format Report Export**: Generate automated Daily, Weekly, Monthly, and Yearly executive summaries with **PDF** and **CSV/Excel** export capabilities.
- 📖 **Interactive Swagger OpenAPI Docs**: Built-in Swagger UI explorer mounted at `/api-docs`.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js (v4.19+)
- **Database Drivers**: `mysql2` (MySQL Pool) & `sql.js` (SQLite disk-sync fallback)
- **Security**: `jsonwebtoken` (JWT), `bcryptjs` (Password Hashing)
- **Media & File Storage**: `cloudinary` + `multer`
- **Email & Notifications**: `nodemailer` (SMTP Gmail integration)
- **QR Code Generation**: `qrcode`
- **Documentation**: `swagger-ui-express`

---

## 📂 Project Structure

```bash
├── config/
│   ├── db.js                 # Dual-Engine MySQL/SQLite driver & query translator
│   ├── cloudinary.js         # Cloudinary media upload configuration
│   └── email.js              # Nodemailer SMTP transporter & email templates
├── controllers/              # 20 Modular Controllers handling business logic
│   ├── authController.js     # Citizen/Staff/Admin IAM & OTP authentication
│   ├── washroomController.js # Geospatial nearby search & facility mapping
│   ├── complaintController.js# Complaint submission, status progression & timeline
│   ├── aiController.js       # AI vision grading & chatbot assistant logic
│   ├── analyticsController.js# Heatmaps, resolution speeds & ward problem density
│   └── ...                   # (15 more controllers covering all civic modules)
├── database/
│   ├── schema.sql            # Master DDL defining all 35 relational tables
│   └── seed.js               # Enterprise seeder populating demo users & washrooms
├── docs/
│   └── swagger.js            # Complete OpenAPI 3.0 specification
├── middleware/
│   ├── auth.js               # JWT verification & checkRole RBAC guard
│   ├── errorHandler.js       # Global error formatting & exception handling
│   └── upload.js             # Multer multipart/form-data file interceptor
├── routes/                   # Express modular routers (`/api/auth`, `/api/washrooms`, etc.)
├── services/
│   ├── aiService.js          # AI cleanliness score calculation & damage detection
│   ├── qrService.js          # Base64/PNG QR image generation
│   └── reportService.js      # Executive summary & CSV data export formatting
├── public/                   # Static API Explorer web client & uploaded images
├── server.js                 # Main Express application & route mounter
└── test_all_modules.js       # Automated 20-Module E2E verification test suite
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18+ installed on your machine.
- **MySQL Server** (Optional: if offline, the backend automatically uses SQLite).

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/jeniliinnovation/washroom-.git
cd washroom-
npm install
```

### 3. Environment Setup
Create a `.env` file in the project root (defaults work out-of-the-box for local testing):
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=washroom

JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here

# Cloudinary Storage Configuration
CLOUDINARY_NAME=dnmefqcvt
CLOUDINARY_API_KEY=762447733112833
CLOUDINARY_API_SECRET=3BD-ry-r2g0IHEUwD_H26ENBTio

# SMTP Nodemailer Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jeniliinnovation812@gmail.com
SMTP_PASS=wjow aggr nfvt ykmj
```

### 4. Database Seeding
Initialize all **35 database tables** and seed enterprise demo data (7 users across all roles, wards, washrooms, and complaints):
```bash
npm run seed
```

### 5. Running the Server
Start the development server with hot-reload or in production mode:
```bash
# Development Mode
npm run dev

# Production Mode
npm start
```
The API server will run at: **`http://localhost:5000`**

---

## 🧪 Running the E2E Test Suite

We include an automated end-to-end verification suite (`test_all_modules.js`) that spins up the server and validates all **20 modules** and **100+ endpoints**:
```bash
node test_all_modules.js
```
Expected Output:
```bash
================================================================
📊 TEST SUITE SUMMARY: 56 PASSED | 0 FAILED
================================================================
```

---

## 📖 API Endpoints & Swagger Explorer

Once the server is running, explore and test the endpoints interactively:

- **Interactive API Explorer Page**: [`http://localhost:5000/`](http://localhost:5000/)
- **Swagger OpenAPI 3.0 Documentation**: [`http://localhost:5000/api-docs`](http://localhost:5000/api-docs)

### Core Module Summary:
| Module | Base Path | Key Capabilities |
| :--- | :--- | :--- |
| **Authentication** | `/api/auth` | Login, Register, OTP Send/Verify, Google OAuth, Forgot Password |
| **User Management** | `/api/users` | Admin search, status toggling (`Active/Suspended`), role assignment |
| **Washrooms** | `/api/washrooms` | Haversine nearby search, map coordinate bounds, photo galleries |
| **Complaints** | `/api/complaints` | Citizen reporting, timeline tracking, staff assignment, status lifecycle |
| **AI Vision Engine** | `/api/ai` | Automated image cleanliness grading (`0-100`), damage detection, NLP chat |
| **QR Code Engine** | `/api/qr` | Dynamic QR code generation, physical scan lookup & reporting |
| **Cleaning Tasks** | `/api/tasks` | Routine shift scheduling, sanitation checklist tracking |
| **Staff & Supervisor** | `/api/staff` & `/api/supervisor` | Biometric check-ins, performance KPIs, ward team management |
| **Analytics & Heatmap**| `/api/analytics` | Resolution speed tracking, top 10 problem areas, geo-heatmaps |
| **Report Exports** | `/api/reports` | Daily/Monthly summaries, PDF export metadata, CSV/Excel dumps |
| **System Settings** | `/api/settings` | Dynamic SMTP, Cloudinary, SMS, and Push notification settings |

---

## 👥 Default Demo Credentials

After running `npm run seed`, you can test the platform using these credentials (password for all demo accounts is **`password123`**):

| Role | Email | Name | Ward / Responsibility |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@clean.org` | Super Admin | Global Headquarters |
| **Municipality Admin** | `admin.vikram@clean.org` | Vikram Singh | City-wide Municipal Corporation |
| **Ward Supervisor** | `supervisor.anita@clean.org` | Anita Verma | Ward 4 - Central Station |
| **Cleaning Staff** | `staff.ramesh@clean.org` | Ramesh Kumar | Ward 4 - Platform 1-4 Area |
| **Citizen** | `citizen@clean.org` | Rahul Sharma | Swachh Bharat Citizen (`120 pts`) |

---

## 📄 License
This project is licensed under the MIT License. Built with ❤️ for Smart City Civic Infrastructure.