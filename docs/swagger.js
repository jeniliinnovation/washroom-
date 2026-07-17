const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Clean Toilet Portal - 20-Module Enterprise Backend API (PWMS)',
    version: '2.0.0',
    description: `Complete Smart Public Washroom Complaint System (PWMS) API specification powering 20 civic modules with real-time MySQL/SQLite dual-engine support, AI vision analysis, QR lookup, and municipal analytics.`,
    contact: {
      name: 'Smart City Civic Infrastructure Team',
      email: 'support@clean.org'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token generated from /api/auth/login or /api/auth/register'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error description message' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Rahul Sharma' },
          email: { type: 'string', example: 'citizen@clean.org' },
          role: { type: 'string', example: 'CITIZEN' },
          ward_name: { type: 'string', example: 'Ward 4 - Central Station' },
          civic_points: { type: 'integer', example: 120 }
        }
      },
      Washroom: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Central Railway Station Public Toilet' },
          address: { type: 'string', example: 'Platform 1 Concourse' },
          ward: { type: 'string', example: 'Ward 4 - Central Station' },
          latitude: { type: 'number', example: 28.6139 },
          longitude: { type: 'number', example: 77.2090 },
          qr_code_id: { type: 'string', example: 'QR-WASH-101' },
          cleanliness_score: { type: 'integer', example: 88 },
          status: { type: 'string', example: 'Active' }
        }
      },
      Complaint: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          complaint_code: { type: 'string', example: 'PWMS-2026-0001' },
          category: { type: 'string', example: 'Overflowing Drain & Flooding' },
          priority: { type: 'string', example: 'Urgent' },
          status: { type: 'string', example: 'Assigned' },
          description: { type: 'string', example: 'Water is backing up near washbasins.' }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: '1. Authentication', description: 'User registration, login, JWT management, OTP verification & profile' },
    { name: '2. User Management', description: 'Admin user CRUD, status/role assignment & searching' },
    { name: '3. Public Washrooms', description: 'Washroom registry, GPS radius search, map coordinates & gallery' },
    { name: '4. Facilities', description: 'Civic facility master catalogue and washroom assignments' },
    { name: '5. Complaints Engine', description: 'Complaint submission, lifecycle status transitions & audit timeline' },
    { name: '6. Complaint Media', description: 'Before/After photo, video & audio attachment handling' },
    { name: '7. QR Code Module', description: 'Dynamic QR generator, physical sticker lookup & instant check' },
    { name: '8. Cleaning Tasks', description: 'Staff cleaning shift tracking, start/pause/resume & photo proof' },
    { name: '9. Staff Management', description: 'Staff registry, live GPS tracking, performance KPI & attendance' },
    { name: '10. Supervisor', description: 'Ward supervisor verification, job reopening & team task board' },
    { name: '11. Reviews', description: 'Citizen public cleanliness reviews & feedback' },
    { name: '12. Ratings', description: 'Multi-parameter cleanliness, odor & water rating metrics' },
    { name: '13. Notifications', description: 'Real-time notification dispatch, unread badges & templates' },
    { name: '14. Dashboards', description: 'Specialized executive summaries for Admin, Staff, Supervisor & Citizen' },
    { name: '15. Analytics', description: 'Resolution time SLAs, top problem areas, heatmaps & monthly trends' },
    { name: '16. Reports', description: 'Daily/weekly/monthly/yearly reports & PDF/Excel exports' },
    { name: '17. Master Data', description: 'System catalogues: cities, wards, categories, priorities, roles & permissions' },
    { name: '18. AI Cleanliness Engine', description: 'Simulated computer vision diagnosis, priority prediction & chatbot' },
    { name: '19. Audit Logs', description: 'System-wide activity tracker, login history & error logs' },
    { name: '20. System Settings', description: 'Super admin configurations: Email SMTP, SMS gateway, Push & Storage' }
  ],
  paths: {
    // 1. Auth Module
    '/api/auth/register': {
      post: {
        tags: ['1. Authentication'],
        summary: 'Register new civic account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'john@clean.org' },
                  password: { type: 'string', example: 'password123' },
                  role: { type: 'string', example: 'CITIZEN' },
                  ward_name: { type: 'string', example: 'Ward 4 - Central Station' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Registered successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['1. Authentication'],
        summary: 'Login with email & password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'citizen@clean.org' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful with JWT access and refresh token' }
        }
      }
    },
    '/api/auth/send-otp': {
      post: {
        tags: ['1. Authentication'],
        summary: 'Send 6-digit OTP code via Nodemailer SMTP',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', example: 'citizen@clean.org' } } } } }
        },
        responses: { 200: { description: 'OTP sent to email address' } }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['1. Authentication'],
        summary: 'Get current authenticated user profile',
        responses: { 200: { description: 'Current user data' } }
      }
    },
    // 3. Washrooms Module
    '/api/washrooms': {
      get: {
        tags: ['3. Public Washrooms'],
        summary: 'List all public washrooms (optional GPS radius filter)',
        parameters: [
          { name: 'lat', in: 'query', schema: { type: 'number' }, description: 'User latitude' },
          { name: 'lng', in: 'query', schema: { type: 'number' }, description: 'User longitude' },
          { name: 'radiusKm', in: 'query', schema: { type: 'number', default: 15 }, description: 'Search radius in km' }
        ],
        responses: { 200: { description: 'List of washrooms sorted by proximity' } }
      },
      post: {
        tags: ['3. Public Washrooms'],
        summary: 'Create a new public washroom (Admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'address', 'ward', 'latitude', 'longitude', 'qr_code_id'],
                properties: {
                  name: { type: 'string', example: 'Metro Station Convenience' },
                  address: { type: 'string', example: 'Metro Gate 1' },
                  ward: { type: 'string', example: 'Ward 6 - Tech Park' },
                  latitude: { type: 'number', example: 28.5494 },
                  longitude: { type: 'number', example: 77.1212 },
                  qr_code_id: { type: 'string', example: 'QR-WASH-107' }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Washroom created and QR assigned' } }
      }
    },
    '/api/washrooms/nearby': {
      get: {
        tags: ['3. Public Washrooms'],
        summary: 'Get nearby washrooms strictly within GPS radius',
        parameters: [
          { name: 'lat', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'lng', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'radiusKm', in: 'query', schema: { type: 'number', default: 5 } }
        ],
        responses: { 200: { description: 'Nearby washroom facilities' } }
      }
    },
    '/api/washrooms/qr/{qrCodeId}': {
      get: {
        tags: ['7. QR Code Module'],
        summary: 'Instant QR lookup by unique sticker code (e.g. QR-WASH-101)',
        parameters: [{ name: 'qrCodeId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Washroom details and active facilities' } }
      }
    },
    // 5. Complaints Module
    '/api/complaints': {
      post: {
        tags: ['5. Complaints Engine'],
        summary: 'Submit a new citizen complaint (multi-image upload supported)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['washroom_id', 'category'],
                properties: {
                  washroom_id: { type: 'integer', example: 1 },
                  category: { type: 'string', example: 'Overflowing Drain & Flooding' },
                  priority: { type: 'string', example: 'High' },
                  description: { type: 'string', example: 'Drain clogged and water pooling.' },
                  is_anonymous: { type: 'integer', example: 0 }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Complaint registered and assigned tracking code' } }
      },
      get: {
        tags: ['5. Complaints Engine'],
        summary: 'Get role-filtered list of complaints',
        responses: { 200: { description: 'List of complaints' } }
      }
    },
    '/api/complaints/{id}/assign': {
      put: {
        tags: ['5. Complaints Engine'],
        summary: 'Assign cleaning staff and SLA expectation to complaint',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['assigned_staff_id'], properties: { assigned_staff_id: { type: 'integer', example: 3 }, expected_hours: { type: 'number', example: 2 } } } } }
        },
        responses: { 200: { description: 'Staff assigned' } }
      }
    },
    // 8. Tasks Module
    '/api/tasks': {
      get: {
        tags: ['8. Cleaning Tasks'],
        summary: 'List cleaning shift tasks for staff or supervisor',
        responses: { 200: { description: 'Cleaning tasks list' } }
      },
      post: {
        tags: ['8. Cleaning Tasks'],
        summary: 'Create a new scheduled cleaning task',
        responses: { 201: { description: 'Task scheduled' } }
      }
    },
    // 14. Dashboards Module
    '/api/dashboard/admin': {
      get: {
        tags: ['14. Dashboards'],
        summary: 'Get city-wide municipal executive summary for Admin',
        responses: { 200: { description: 'Admin dashboard metrics and status breakdowns' } }
      }
    },
    '/api/dashboard/supervisor': {
      get: {
        tags: ['14. Dashboards'],
        summary: 'Get ward supervisor team dashboard and pending verifications',
        responses: { 200: { description: 'Supervisor dashboard data' } }
      }
    },
    // 15. Analytics Module
    '/api/analytics/dashboard': {
      get: {
        tags: ['15. Analytics'],
        summary: 'Executive analytics summary (total washrooms, active vs resolved, satisfaction)',
        responses: { 200: { description: 'Analytics KPIs' } }
      }
    },
    // 16. Reports Module
    '/api/reports/export/excel': {
      get: {
        tags: ['16. Reports'],
        summary: 'Download municipal complaint summary spreadsheet in Excel/CSV format',
        responses: { 200: { description: 'CSV/Excel attachment download' } }
      }
    },
    // 18. AI Module
    '/api/ai/analyze-image': {
      post: {
        tags: ['18. AI Cleanliness Engine'],
        summary: 'Computer vision cleanliness simulation, anomaly detection & priority calculation',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['washroom_id'], properties: { washroom_id: { type: 'integer', example: 1 }, image_url: { type: 'string', example: '/uploads/sample_overflow_1.jpg' } } } } }
        },
        responses: { 200: { description: 'AI diagnostic score and bounding box tags' } }
      }
    }
  }
};

module.exports = swaggerSpec;
