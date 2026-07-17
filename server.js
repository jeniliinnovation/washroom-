require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const db = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

// Route imports across all 20 Modules
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const washroomRoutes = require('./routes/washroomRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const qrRoutes = require('./routes/qrRoutes');
const taskRoutes = require('./routes/taskRoutes');
const staffRoutes = require('./routes/staffRoutes');
const supervisorRoutes = require('./routes/supervisorRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const masterRoutes = require('./routes/masterRoutes');
const aiRoutes = require('./routes/aiRoutes');
const auditRoutes = require('./routes/auditRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Static folder for uploaded files and API explorer UI
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
app.use(express.static(publicDir));

// Mount Swagger OpenAPI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { background-color: #1e293b; }',
  customSiteTitle: 'Clean Toilet Portal - API Documentation'
}));

// Mount API Routes for all 20 Modules
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/washrooms', washroomRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/master', masterRoutes);
app.use('/api', masterRoutes); // Direct master lookups (/api/categories, /api/cities, etc.)
app.use('/api/ai', aiRoutes);
app.use('/api/logs', auditRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);

// Health Check / API Root redirection to interactive API Explorer
app.get('/', (req, res) => {
  const explorerPath = path.join(__dirname, 'public/api-explorer.html');
  if (fs.existsSync(explorerPath)) {
    res.sendFile(explorerPath);
  } else {
    res.status(200).json({
      success: true,
      message: '🚀 Swatch Washroom Portal (PWMS) - Smart City Backend API is Running!',
      swagger_docs: `/api-docs`,
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        washrooms: '/api/washrooms',
        facilities: '/api/facilities',
        complaints: '/api/complaints',
        media: '/api/media',
        qr: '/api/qr',
        tasks: '/api/tasks',
        staff: '/api/staff',
        supervisor: '/api/supervisor',
        reviews: '/api/reviews',
        ratings: '/api/ratings',
        notifications: '/api/notifications',
        dashboard: '/api/dashboard',
        analytics: '/api/analytics',
        reports: '/api/reports',
        master: '/api/master',
        ai: '/api/ai',
        logs: '/api/logs',
        settings: '/api/settings'
      }
    });
  }
});

// Global Error Handler
app.use(errorHandler);

// Start Server after verifying Database Connection
async function startServer() {
  console.log('🔄 Initializing Database & checking connection...');
  await db.testMysqlConnection();

  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Smart Public Washroom Complaint System Backend API`);
    console.log(`🌐 Running on: http://localhost:${PORT}`);
    console.log(`📖 Interactive API Explorer: http://localhost:${PORT}/`);
    console.log(`📚 Swagger OpenAPI Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`======================================================\n`);
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('❌ Failed to start server:', err);
  });
}

module.exports = app;
