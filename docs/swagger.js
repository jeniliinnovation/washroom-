/**
 * Complete OpenAPI 3.0 Specification covering all 20 Modules and 144 REST API Endpoints
 * Smart Public Washroom Management & Complaint Portal (PWMS)
 */

const paths = {};

/**
 * Helper to cleanly register OpenAPI path definitions without nesting issues
 */
function addRoute(path, method, tag, summary, requestBody = null, parameters = null, resCode = 200, resDesc = 'Operation completed successfully') {
  if (!paths[path]) paths[path] = {};
  paths[path][method] = {
    tags: [tag],
    summary: summary,
    ...(parameters && { parameters: parameters }),
    ...(requestBody && { requestBody: requestBody }),
    responses: {
      [resCode]: { description: resDesc }
    }
  };
}

/**
 * Helper to generate application/json request body schemas without brace clutter
 */
function jsonBody(properties, required = null) {
  const schema = { type: 'object', properties: properties };
  if (required && required.length > 0) schema.required = required;
  return {
    required: required !== null && required.length > 0,
    content: {
      'application/json': { schema: schema }
    }
  };
}

/**
 * Helper to generate multipart/form-data request body schemas without brace clutter
 */
function formBody(properties, required = null) {
  const schema = { type: 'object', properties: properties };
  if (required && required.length > 0) schema.required = required;
  return {
    required: required !== null && required.length > 0,
    content: {
      'multipart/form-data': { schema: schema }
    }
  };
}

// Common Parameters
const idParam = [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', example: 1 }, description: 'Resource ID' }];
const stringIdParam = [{ name: 'id', in: 'path', required: true, schema: { type: 'string', example: 'QR-WASH-101' }, description: 'Unique Identifier' }];

// ==========================================
// MODULE 1: AUTHENTICATION MODULE (17 APIs)
// ==========================================
const T_AUTH = '1. Authentication';
addRoute('/api/auth/register', 'post', T_AUTH, 'Register new citizen/staff account', jsonBody({ name: { type: 'string', example: 'John Doe' }, email: { type: 'string', example: 'john@clean.org' }, phone: { type: 'string', example: '9876543210' }, password: { type: 'string', example: 'password123' }, role: { type: 'string', example: 'CITIZEN' }, ward_name: { type: 'string', example: 'Ward 4 - Central Station' } }, ['name', 'email', 'password']), null, 201, 'Account registered successfully');
addRoute('/api/auth/login', 'post', T_AUTH, 'Login with email & password', jsonBody({ email: { type: 'string', example: 'citizen@clean.org' }, password: { type: 'string', example: 'password123' } }, ['email', 'password']), null, 200, 'Returns JWT access/refresh tokens and user profile');
addRoute('/api/auth/logout', 'post', T_AUTH, 'Logout active session & invalidate tokens');
addRoute('/api/auth/refresh-token', 'post', T_AUTH, 'Refresh expired access token', jsonBody({ refresh_token: { type: 'string' } }));
addRoute('/api/auth/send-otp', 'post', T_AUTH, 'Send 6-digit verification OTP code via Nodemailer SMTP', jsonBody({ email: { type: 'string', example: 'citizen@clean.org' } }, ['email']));
addRoute('/api/auth/verify-otp', 'post', T_AUTH, 'Verify 6-digit OTP code', jsonBody({ email: { type: 'string', example: 'citizen@clean.org' }, otp: { type: 'string', example: '123456' } }, ['email', 'otp']));
addRoute('/api/auth/resend-otp', 'post', T_AUTH, 'Resend OTP verification code to email', jsonBody({ email: { type: 'string' } }));
addRoute('/api/auth/otp-login', 'post', T_AUTH, 'Passwordless OTP-based login verification', jsonBody({ email: { type: 'string' }, otp: { type: 'string' } }));
addRoute('/api/auth/google-login', 'post', T_AUTH, 'OAuth login with Google ID Token', jsonBody({ id_token: { type: 'string' } }));
addRoute('/api/auth/forgot-password', 'post', T_AUTH, 'Request password reset OTP verification code', jsonBody({ email: { type: 'string', example: 'citizen@clean.org' } }));
addRoute('/api/auth/reset-password', 'post', T_AUTH, 'Reset password using verified OTP code', jsonBody({ email: { type: 'string' }, otp: { type: 'string' }, new_password: { type: 'string' } }));
addRoute('/api/auth/me', 'get', T_AUTH, 'Get currently authenticated user profile & civic reward points');
addRoute('/api/auth/profile', 'get', T_AUTH, 'Get full user profile metadata');
addRoute('/api/auth/profile', 'put', T_AUTH, 'Update profile name, phone & ward assignment', jsonBody({ name: { type: 'string' }, phone: { type: 'string' }, ward_name: { type: 'string' } }));
addRoute('/api/auth/profile-image', 'put', T_AUTH, 'Upload/Update profile avatar photo', formBody({ image: { type: 'string', format: 'binary' } }));
addRoute('/api/auth/change-password', 'post', T_AUTH, 'Change account password while logged in', jsonBody({ current_password: { type: 'string' }, new_password: { type: 'string' } }));
addRoute('/api/auth/account', 'delete', T_AUTH, 'Delete account and anonymize civic data');

// ==========================================
// MODULE 2: USER MANAGEMENT MODULE (7 APIs)
// ==========================================
const T_USERS = '2. User Management';
addRoute('/api/users', 'get', T_USERS, 'List all registered users (Admin/Supervisor)');
addRoute('/api/users/search', 'get', T_USERS, 'Search users by keyword, name, email or role', null, [{ name: 'q', in: 'query', required: true, schema: { type: 'string', example: 'Citizen' } }]);
addRoute('/api/users/{id}', 'get', T_USERS, 'Get detailed user account metadata by ID', null, idParam);
addRoute('/api/users/{id}', 'put', T_USERS, 'Update user account profile information by ID', jsonBody({ name: { type: 'string' }, phone: { type: 'string' } }), idParam);
addRoute('/api/users/{id}', 'delete', T_USERS, 'Delete user account by ID', null, idParam);
addRoute('/api/users/{id}/status', 'put', T_USERS, 'Update user account status (Active / Suspended)', jsonBody({ status: { type: 'string', example: 'Suspended' } }), idParam);
addRoute('/api/users/{id}/role', 'put', T_USERS, 'Update assigned role (`CITIZEN`, `STAFF`, `SUPERVISOR`, `ADMIN`)', jsonBody({ role: { type: 'string', example: 'SUPERVISOR' } }), idParam);

// ==========================================
// MODULE 3: PUBLIC WASHROOM CATALOG (14 APIs)
// ==========================================
const T_WASHROOMS = '3. Public Washrooms';
addRoute('/api/washrooms', 'get', T_WASHROOMS, 'List all public washrooms across wards');
addRoute('/api/washrooms', 'post', T_WASHROOMS, 'Register new public washroom and auto-generate unique QR code (`QR-WASH-XXX`)', jsonBody({ name: { type: 'string', example: 'Dadar Station Sulabh' }, ward_name: { type: 'string', example: 'Ward 3 - Market Area' }, address: { type: 'string' }, latitude: { type: 'number', example: 19.0178 }, longitude: { type: 'number', example: 72.8478 } }, ['name', 'ward_name', 'address', 'latitude', 'longitude']), null, 201, 'Washroom registered along with QR code');
addRoute('/api/washrooms/nearby', 'get', T_WASHROOMS, 'Find nearby washrooms within GPS distance radius', null, [{ name: 'lat', in: 'query', required: true, schema: { type: 'number', example: 19.0760 } }, { name: 'lng', in: 'query', required: true, schema: { type: 'number', example: 72.8777 } }, { name: 'radiusKm', in: 'query', schema: { type: 'number', example: 10 } }]);
addRoute('/api/washrooms/search', 'get', T_WASHROOMS, 'Search washrooms by name, ward, or facility filter', null, [{ name: 'q', in: 'query', required: true, schema: { type: 'string', example: 'Station' } }]);
addRoute('/api/washrooms/map', 'get', T_WASHROOMS, 'Get map coordinate points & pins for GIS plotting');
addRoute('/api/washrooms/stats', 'get', T_WASHROOMS, 'Get washroom catalog statistics & distribution KPIs');
addRoute('/api/washrooms/{id}', 'get', T_WASHROOMS, 'Get washroom details, facilities & active issues by ID', null, idParam);
addRoute('/api/washrooms/{id}', 'put', T_WASHROOMS, 'Update washroom metadata, operating hours & address', jsonBody({ name: { type: 'string' }, address: { type: 'string' } }), idParam);
addRoute('/api/washrooms/{id}', 'delete', T_WASHROOMS, 'Delete public washroom entry', null, idParam);
addRoute('/api/washrooms/{id}/status', 'put', T_WASHROOMS, 'Update operational status (`Active`, `Maintenance`, `Closed`)', jsonBody({ status: { type: 'string', example: 'Maintenance' } }), idParam);
addRoute('/api/washrooms/{id}/facilities', 'put', T_WASHROOMS, 'Update available facility IDs mapping (`Wheelchair`, `Water`, etc.)', jsonBody({ facilities: { type: 'array', items: { type: 'integer' } } }), idParam);
addRoute('/api/washrooms/{id}/images', 'get', T_WASHROOMS, 'Get washroom photo gallery images', null, idParam);
addRoute('/api/washrooms/{id}/images', 'post', T_WASHROOMS, 'Upload photos to washroom gallery', formBody({ images: { type: 'array', items: { type: 'string', format: 'binary' } } }), idParam, 201, 'Photos uploaded');
addRoute('/api/washrooms/images/{id}', 'delete', T_WASHROOMS, 'Delete washroom gallery image by image ID', null, idParam);

// ==========================================
// MODULE 4: FACILITIES CATALOG (4 APIs)
// ==========================================
const T_FACILITIES = '4. Facilities';
addRoute('/api/facilities', 'get', T_FACILITIES, 'List master civic facilities catalog (`Wheelchair`, `Baby Changing`)');
addRoute('/api/facilities', 'post', T_FACILITIES, 'Add new master facility option', jsonBody({ name: { type: 'string', example: 'Solar Powered Lighting' }, icon: { type: 'string', example: 'sun-icon' } }), null, 201, 'Facility created');
addRoute('/api/facilities/{id}', 'put', T_FACILITIES, 'Update facility name or icon', jsonBody({ name: { type: 'string' } }), idParam);
addRoute('/api/facilities/{id}', 'delete', T_FACILITIES, 'Delete master facility entry', null, idParam);

// ==========================================
// MODULE 5: COMPLAINTS LIFECYCLE ENGINE (14 APIs)
// ==========================================
const T_COMPLAINTS = '5. Complaints Engine';
addRoute('/api/complaints', 'get', T_COMPLAINTS, 'List role-filtered complaints across wards (`Submitted`, `Assigned`, `Resolved`)');
addRoute('/api/complaints', 'post', T_COMPLAINTS, 'Submit citizen complaint with photo evidence & award Swachh Bharat civic points', formBody({ washroom_id: { type: 'integer', example: 1 }, category: { type: 'string', example: 'Unhygienic/Dirty' }, title: { type: 'string', example: 'Dirty floor and overflowing bins' }, description: { type: 'string' }, priority: { type: 'string', example: 'High' }, images: { type: 'array', items: { type: 'string', format: 'binary' } } }, ['washroom_id', 'category', 'title']), null, 201, 'Complaint submitted & civic points awarded');
addRoute('/api/complaints/history', 'get', T_COMPLAINTS, 'Get logged-in user complaint history & rewards earned');
addRoute('/api/complaints/timeline/{id}', 'get', T_COMPLAINTS, 'Get chronological audit progression trail (`Submitted` -> `Assigned` -> `Resolved` -> `Verified`)', null, idParam);
addRoute('/api/complaints/{id}', 'get', T_COMPLAINTS, 'Get complaint details, assigned cleaning staff & media attachments by ID', null, idParam);
addRoute('/api/complaints/{id}', 'put', T_COMPLAINTS, 'Update complaint title or description', jsonBody({ title: { type: 'string' }, description: { type: 'string' } }), idParam);
addRoute('/api/complaints/{id}', 'delete', T_COMPLAINTS, 'Delete complaint record (Admin only)', null, idParam);
addRoute('/api/complaints/{id}/assign', 'patch', T_COMPLAINTS, 'Assign cleaning staff member to resolve complaint ticket', jsonBody({ staff_id: { type: 'integer', example: 4 }, supervisor_notes: { type: 'string', example: 'Please carry disinfectant mop.' } }, ['staff_id']), idParam);
addRoute('/api/complaints/{id}/status', 'put', T_COMPLAINTS, 'Update status (`In Progress`/`Resolved`) & attach proof photos', formBody({ status: { type: 'string', example: 'Resolved' }, resolution_notes: { type: 'string', example: 'Cleaned thoroughly' }, after_images: { type: 'array', items: { type: 'string', format: 'binary' } } }, ['status']), idParam);
addRoute('/api/complaints/{id}/cancel', 'put', T_COMPLAINTS, 'Cancel submitted complaint by citizen or admin', jsonBody({ reason: { type: 'string' } }), idParam);
addRoute('/api/complaints/{id}/priority', 'put', T_COMPLAINTS, 'Update severity priority level (`Low`, `Medium`, `High`, `Critical`)', jsonBody({ priority: { type: 'string', example: 'Critical' } }), idParam);
addRoute('/api/complaints/{id}/photos', 'post', T_COMPLAINTS, 'Upload additional before/after proof photos to complaint', formBody({ photos: { type: 'array', items: { type: 'string', format: 'binary' } } }), idParam, 201, 'Photos uploaded');
addRoute('/api/complaints/{id}/videos', 'post', T_COMPLAINTS, 'Upload video proof attachment to complaint', formBody({ video: { type: 'string', format: 'binary' } }), idParam, 201, 'Video uploaded');
addRoute('/api/complaints/{id}/verify', 'patch', T_COMPLAINTS, 'Supervisor verification of resolved complaint (`Approved & Closed` or `Reopened`)', jsonBody({ is_verified: { type: 'boolean', example: true }, verification_notes: { type: 'string', example: 'Inspected and verified clean.' } }), idParam);

// ==========================================
// MODULE 6: COMPLAINT MEDIA (1 API)
// ==========================================
const T_MEDIA = '6. Complaint Media';
addRoute('/api/complaints/{id}/media', 'get', T_MEDIA, 'Get all before/after photos, videos & audio files attached to a complaint', null, idParam);

// ==========================================
// MODULE 7: QR CODE ENGINE (3 APIs)
// ==========================================
const T_QR = '7. QR Code Module';
addRoute('/api/qr/{id}', 'get', T_QR, 'Get QR code details, PNG rendering & Base64 URI string by ID', null, stringIdParam);
addRoute('/api/qr/scan', 'post', T_QR, 'Scan physical QR sticker outside washroom (`QR-WASH-101`) to instantly fetch washroom details & active issues', jsonBody({ code_id: { type: 'string', example: 'QR-WASH-101' } }, ['code_id']));
addRoute('/api/qr/generate', 'post', T_QR, 'Generate new physical QR code for a washroom', jsonBody({ washroom_id: { type: 'integer', example: 1 } }, ['washroom_id']), null, 201, 'QR code generated');

// ==========================================
// MODULE 8: CLEANING TASKS & MAINTENANCE (10 APIs)
// ==========================================
const T_TASKS = '8. Cleaning Tasks';
addRoute('/api/tasks', 'get', T_TASKS, 'List scheduled cleaning shifts and maintenance checklists');
addRoute('/api/tasks', 'post', T_TASKS, 'Schedule new cleaning shift or maintenance checklist task', jsonBody({ washroom_id: { type: 'integer', example: 1 }, staff_id: { type: 'integer', example: 4 }, title: { type: 'string', example: 'Morning Deep Sanitization' }, priority: { type: 'string', example: 'Medium' } }, ['washroom_id', 'staff_id', 'title']), null, 201, 'Task scheduled');
addRoute('/api/tasks/{id}', 'get', T_TASKS, 'Get cleaning task details & checklist items by ID', null, idParam);
addRoute('/api/tasks/{id}', 'put', T_TASKS, 'Update scheduled task details', jsonBody({ title: { type: 'string' }, priority: { type: 'string' } }), idParam);
addRoute('/api/tasks/{id}', 'delete', T_TASKS, 'Delete scheduled shift task', null, idParam);
addRoute('/api/tasks/{id}/checkin', 'patch', T_TASKS, 'Staff biometric check-in when starting cleaning shift', null, idParam);
addRoute('/api/tasks/{id}/checkout', 'patch', T_TASKS, 'Staff check-out when leaving shift', null, idParam);
addRoute('/api/tasks/{id}/pause', 'patch', T_TASKS, 'Pause ongoing cleaning shift task', null, idParam);
addRoute('/api/tasks/{id}/resume', 'patch', T_TASKS, 'Resume paused cleaning shift task', null, idParam);
addRoute('/api/tasks/{id}/complete', 'patch', T_TASKS, 'Mark shift task as completed and submit checklist proof', jsonBody({ notes: { type: 'string' } }), idParam);

// ==========================================
// MODULE 9: STAFF & BIOMETRIC OPERATIONS (8 APIs)
// ==========================================
const T_STAFF = '9. Staff Management';
addRoute('/api/staff', 'get', T_STAFF, 'List all cleaning staff members and live shift availability');
addRoute('/api/staff/performance', 'get', T_STAFF, 'Staff performance leaderboard (`avg resolution speed`, `cleanliness score`)');
addRoute('/api/staff/attendance', 'get', T_STAFF, 'Get daily attendance records and check-in timestamps');
addRoute('/api/staff/checkin', 'post', T_STAFF, 'Biometric check-in for staff shift start', jsonBody({ staff_id: { type: 'integer' }, latitude: { type: 'number' }, longitude: { type: 'number' } }));
addRoute('/api/staff/checkout', 'post', T_STAFF, 'Biometric check-out at shift end', jsonBody({ staff_id: { type: 'integer' } }));
addRoute('/api/staff/location', 'put', T_STAFF, 'Update live GPS tracking location during active shift', jsonBody({ latitude: { type: 'number' }, longitude: { type: 'number' } }));
addRoute('/api/staff/{id}/shifts', 'get', T_STAFF, 'Get assigned shift schedule for staff member ID', null, idParam);
addRoute('/api/staff/{id}/history', 'get', T_STAFF, 'Get historical completed jobs and ratings for staff member ID', null, idParam);

// ==========================================
// MODULE 10: SUPERVISOR MANAGEMENT (5 APIs)
// ==========================================
const T_SUPER = '10. Supervisor';
addRoute('/api/supervisor/dashboard', 'get', T_SUPER, 'Get ward supervisor dashboard overview and pending verification queue');
addRoute('/api/supervisor/team', 'get', T_SUPER, 'Get cleaning staff team members under active supervisor ward');
addRoute('/api/supervisor/tasks', 'get', T_SUPER, 'Get active ward tasks and check-up rounds under supervisor');
addRoute('/api/supervisor/verify/{id}', 'patch', T_SUPER, 'Verify resolved job or reopen with instructions', jsonBody({ is_approved: { type: 'boolean' }, notes: { type: 'string' } }), idParam);
addRoute('/api/supervisor/assign-shift', 'post', T_SUPER, 'Assign weekly shift schedule to ward staff', jsonBody({ staff_id: { type: 'integer' }, washroom_id: { type: 'integer' }, shift_time: { type: 'string' } }), null, 201, 'Shift assigned');

// ==========================================
// MODULE 11: CITIZEN REVIEWS (4 APIs)
// ==========================================
const T_REVIEWS = '11. Reviews';
addRoute('/api/reviews', 'get', T_REVIEWS, 'List public citizen cleanliness reviews and feedback comments');
addRoute('/api/reviews', 'post', T_REVIEWS, 'Submit a new review comment for a washroom', jsonBody({ washroom_id: { type: 'integer', example: 1 }, rating: { type: 'integer', example: 5 }, comment: { type: 'string', example: 'Very clean and well maintained!' } }, ['washroom_id', 'rating', 'comment']), null, 201, 'Review submitted');
addRoute('/api/reviews/{id}', 'put', T_REVIEWS, 'Update existing review comment', jsonBody({ comment: { type: 'string' }, rating: { type: 'integer' } }), idParam);
addRoute('/api/reviews/{id}', 'delete', T_REVIEWS, 'Delete review entry', null, idParam);

// ==========================================
// MODULE 12: CLEANLINESS RATINGS (2 APIs)
// ==========================================
const T_RATINGS = '12. Ratings';
addRoute('/api/ratings', 'get', T_RATINGS, 'List aggregated cleanliness ratings (1-5 stars) across washrooms');
addRoute('/api/ratings', 'post', T_RATINGS, 'Submit multi-parameter numerical rating (`cleanliness`, `odor`, `water`)', jsonBody({ washroom_id: { type: 'integer', example: 1 }, cleanliness_score: { type: 'integer', example: 5 }, odor_score: { type: 'integer', example: 4 }, water_availability: { type: 'boolean', example: true } }, ['washroom_id', 'cleanliness_score']), null, 201, 'Rating recorded');

// ==========================================
// MODULE 13: PUSH NOTIFICATIONS ENGINE (4 APIs)
// ==========================================
const T_NOTIF = '13. Notifications';
addRoute('/api/notifications', 'get', T_NOTIF, 'Get user push alerts, task updates & unread badge count');
addRoute('/api/notifications/{id}/read', 'patch', T_NOTIF, 'Mark notification alert as read by ID', null, idParam);
addRoute('/api/notifications/read-all', 'patch', T_NOTIF, 'Mark all pending notifications as read');
addRoute('/api/notifications/{id}', 'delete', T_NOTIF, 'Delete notification alert from tray', null, idParam);

// ==========================================
// MODULE 14: ROLE-SPECIFIC DASHBOARDS (4 APIs)
// ==========================================
const T_DASH = '14. Dashboards';
addRoute('/api/dashboard/admin', 'get', T_DASH, 'Get Municipality Admin executive summary (`Total Toilets`, `Active Complaints`, `Cleanliness Index`)');
addRoute('/api/dashboard/staff', 'get', T_DASH, 'Get Cleaning Staff shift tracker showing assigned pending tickets & completed jobs');
addRoute('/api/dashboard/citizen', 'get', T_DASH, 'Get Citizen Swachh Bharat reward points, badge rank & active reported issues');
addRoute('/api/dashboard/supervisor', 'get', T_DASH, 'Get Supervisor ward team verification dashboard');

// ==========================================
// MODULE 15: GEO-SPATIAL ANALYTICS & KPIS (7 APIs)
// ==========================================
const T_ANALYTICS = '15. Analytics';
addRoute('/api/analytics/dashboard', 'get', T_ANALYTICS, 'Get executive city analytics summary across wards');
addRoute('/api/analytics/complaints', 'get', T_ANALYTICS, 'Get complaint categorical breakdown (`Unhygienic`, `Plumbing`, `Water`)');
addRoute('/api/analytics/resolution-time', 'get', T_ANALYTICS, 'Get average resolution turnaround hours broken down by priority (`Critical vs Low`)');
addRoute('/api/analytics/top-problem-areas', 'get', T_ANALYTICS, 'Top 10 Problem Areas Leaderboard identifying wards with highest complaint volume');
addRoute('/api/analytics/staff-performance', 'get', T_ANALYTICS, 'Get staff efficiency analytics across wards');
addRoute('/api/analytics/heatmap', 'get', T_ANALYTICS, 'Get ward complaint density coordinates (`lat/lng` weights) for GIS heatmap layers');
addRoute('/api/analytics/monthly', 'get', T_ANALYTICS, 'Get month-over-month complaint volume and resolution progression statistics');

// ==========================================
// MODULE 16: REPORT EXPORT ENGINE (6 APIs)
// ==========================================
const T_REPORTS = '16. Reports';
addRoute('/api/reports/daily', 'get', T_REPORTS, 'Get daily municipal summary report (`resolved today`, `new issues`, `active staff`)');
addRoute('/api/reports/export/pdf', 'get', T_REPORTS, 'Export structured metadata ready for executive PDF report generation');
addRoute('/api/reports/export/excel', 'get', T_REPORTS, 'Export complete CSV/Excel spreadsheet dataset of historical complaints');
addRoute('/api/reports/summary', 'get', T_REPORTS, 'Get general municipal executive summary report');
addRoute('/api/reports/ward/{id}', 'get', T_REPORTS, 'Get ward-specific inspection and performance report by Ward ID', null, idParam);
addRoute('/api/reports/custom-range', 'post', T_REPORTS, 'Generate custom date-range analytical report (`start_date to end_date`)', jsonBody({ start_date: { type: 'string', example: '2026-07-01' }, end_date: { type: 'string', example: '2026-07-20' } }));

// ==========================================
// MODULE 17: MASTER DATA CATALOGUES (11 APIs)
// ==========================================
const T_MASTER = '17. Master Data';
addRoute('/api/master/categories', 'get', T_MASTER, 'Get complaint categories dropdown options catalog (`Unhygienic/Dirty`, `No Water`, etc.)');
addRoute('/api/master/categories', 'post', T_MASTER, 'Add new complaint category option (Super Admin)', jsonBody({ name: { type: 'string', example: 'Solar Panel Failure' } }), null, 201, 'Category added');
addRoute('/api/master/status', 'get', T_MASTER, 'Get status options catalog (`Submitted`, `Assigned`, `In Progress`, `Resolved`, `Closed`)');
addRoute('/api/master/cities', 'get', T_MASTER, 'Get supported municipal corporation cities list (`Mumbai`, `Delhi`, `Bangalore`, etc.)');
addRoute('/api/master/cities', 'post', T_MASTER, 'Add new supported municipal city', jsonBody({ name: { type: 'string', example: 'Indore' }, state: { type: 'string', example: 'MP' } }), null, 201, 'City added');
addRoute('/api/master/wards', 'get', T_MASTER, 'Get wards and administrative boundaries list across cities');
addRoute('/api/master/wards', 'post', T_MASTER, 'Add new municipal ward boundary', jsonBody({ name: { type: 'string', example: 'Ward 5 - Airport Road' }, city_id: { type: 'integer', example: 1 } }), null, 201, 'Ward added');
addRoute('/api/master/wards/{id}', 'put', T_MASTER, 'Update ward boundary name or supervisor assignment', jsonBody({ name: { type: 'string' } }), idParam);
addRoute('/api/master/priority', 'get', T_MASTER, 'Get priority severity levels catalog (`Low`, `Medium`, `High`, `Critical`)');
addRoute('/api/master/roles', 'get', T_MASTER, 'Get system roles (`CITIZEN`, `STAFF`, `SUPERVISOR`, `ADMIN`, `SUPER_ADMIN`)');
addRoute('/api/master/permissions', 'get', T_MASTER, 'Get system permission definitions matrix across roles');

// ==========================================
// MODULE 18: AI VISION & CHAT ENGINE (9 APIs)
// ==========================================
const T_AI = '18. AI Cleanliness Engine';
addRoute('/api/ai/detect-dirty', 'post', T_AI, 'Simulate AI computer vision grading on washroom image (returns score 0-100 & tags)', jsonBody({ image_url: { type: 'string', example: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a' } }));
addRoute('/api/ai/image-score', 'post', T_AI, 'Calculate numerical cleanliness index score from image URL', jsonBody({ image_url: { type: 'string' } }));
addRoute('/api/ai/detect-damage', 'post', T_AI, 'Detect structural damage, broken mirrors, or leaking plumbing from image', jsonBody({ image_url: { type: 'string' } }));
addRoute('/api/ai/chat', 'post', T_AI, 'NLP Civic Assistant chatbot answering citizen sanitation queries', jsonBody({ message: { type: 'string', example: 'Where can I find a clean wheelchair-accessible toilet near Dadar Station?' } }, ['message']));
addRoute('/api/ai/summarize', 'post', T_AI, 'Summarize lengthy citizen complaint description into concise executive bullet points', jsonBody({ description: { type: 'string' } }));
addRoute('/api/ai/priority', 'post', T_AI, 'NLP Priority Classifier predicting `Critical vs Low` based on issue description', jsonBody({ category: { type: 'string', example: 'Blocked/Overflowing Toilet' }, description: { type: 'string', example: 'Sewage pipe burst and flooding main walkway outside toilet!' } }, ['description']));
addRoute('/api/ai/duplicate', 'post', T_AI, 'AI check detecting duplicate complaints reported within 100 meters in last 24 hours', jsonBody({ washroom_id: { type: 'integer' }, description: { type: 'string' } }));
addRoute('/api/ai/moderation', 'post', T_AI, 'AI content moderation filter detecting abusive language or spam in reviews', jsonBody({ text: { type: 'string' } }));
addRoute('/api/ai/analyze', 'post', T_AI, 'Full multi-modal AI scan combining cleanliness score, damage analysis, and priority prediction', jsonBody({ image_url: { type: 'string' }, description: { type: 'string' } }));

// ==========================================
// MODULE 19: SECURITY AUDIT & SYSTEM LOGS (4 APIs)
// ==========================================
const T_LOGS = '19. Audit Logs';
addRoute('/api/logs', 'get', T_LOGS, 'List immutable security audit records across administrative operations');
addRoute('/api/logs/login', 'get', T_LOGS, 'List login attempt history (`Successful vs Failed` attempts across IPs)');
addRoute('/api/logs/activity', 'get', T_LOGS, 'List user activity trail (`Status progression`, `Staff check-ins`)');
addRoute('/api/logs/error', 'get', T_LOGS, 'List uncaught exception logs, database errors & API failures for debugging');

// ==========================================
// MODULE 20: SYSTEM SETTINGS & SMTP (10 APIs)
// ==========================================
const T_SETTINGS = '20. System Settings';
addRoute('/api/settings', 'get', T_SETTINGS, 'Get all grouped system configurations (`general`, `email`, `sms`, `push`, `storage`)');
addRoute('/api/settings', 'put', T_SETTINGS, 'Update system configuration key-value pair', jsonBody({ key: { type: 'string', example: 'app_name' }, value: { type: 'string', example: 'Clean Toilet Portal PWMS' } }));
addRoute('/api/settings/email', 'get', T_SETTINGS, 'Get Nodemailer SMTP configurations (`smtp.gmail.com:587`)');
addRoute('/api/settings/email', 'put', T_SETTINGS, 'Update Nodemailer SMTP server host, port & credentials', jsonBody({ host: { type: 'string', example: 'smtp.gmail.com' }, port: { type: 'integer', example: 587 }, user: { type: 'string' } }));
addRoute('/api/settings/sms', 'get', T_SETTINGS, 'Get SMS gateway API key configurations');
addRoute('/api/settings/sms', 'put', T_SETTINGS, 'Update SMS gateway provider credentials', jsonBody({ provider: { type: 'string', example: 'Twilio' } }));
addRoute('/api/settings/push', 'get', T_SETTINGS, 'Get Push Notification (Firebase FCM / Apple APNS) keys');
addRoute('/api/settings/push', 'put', T_SETTINGS, 'Update Firebase/Apple Push notification keys', jsonBody({ fcm_server_key: { type: 'string' } }));
addRoute('/api/settings/storage', 'get', T_SETTINGS, 'Get Cloudinary / AWS S3 media storage configurations');
addRoute('/api/settings/storage', 'put', T_SETTINGS, 'Update Cloudinary API key, secret & cloud name', jsonBody({ cloud_name: { type: 'string' }, api_key: { type: 'string' } }));

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Clean Toilet Portal - 20-Module Enterprise Backend API (PWMS)',
    version: '2.0.0',
    description: `Comprehensive REST API specification powering all 20 modules of the Smart City Public Washroom Complaint System (PWMS). Covers Authentication, User Management, Washroom Catalog, Facilities, Complaints Lifecycle, Media, QR Lookup, Cleaning Tasks, Staff Operations, Supervisor Verification, Reviews, Ratings, Notifications, Role Dashboards, Geo-Spatial Analytics, PDF/Excel Reports, Master Catalogues, AI Vision Diagnosis, Security Audit Logs, and System Settings.`,
    contact: {
      name: 'Smart City Civic Infrastructure Team',
      email: 'support@clean.org',
      url: 'http://localhost:5000'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development & E2E Verification Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token obtained from /api/auth/login or /api/auth/register'
      }
    },
    schemas: {
      ApiResponseSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Rahul Sharma' },
          email: { type: 'string', example: 'citizen@clean.org' },
          role: { type: 'string', example: 'CITIZEN' }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: T_AUTH, description: 'Module 1: User registration, login, JWT management, OTP verification & profile updates (17 APIs)' },
    { name: T_USERS, description: 'Module 2: Admin user CRUD, status/role assignment & searching (7 APIs)' },
    { name: T_WASHROOMS, description: 'Module 3: Washroom registry, GPS radius search, map coordinates & gallery (14 APIs)' },
    { name: T_FACILITIES, description: 'Module 4: Civic facility master catalogue and washroom assignments (4 APIs)' },
    { name: T_COMPLAINTS, description: 'Module 5: Complaint submission, lifecycle status transitions & audit timeline (14 APIs)' },
    { name: T_MEDIA, description: 'Module 6: Before/After photo, video & proof attachment handling (1 API)' },
    { name: T_QR, description: 'Module 7: Dynamic QR generator, physical sticker lookup & instant check (3 APIs)' },
    { name: T_TASKS, description: 'Module 8: Staff cleaning shift tracking, start/pause/resume & photo proof (10 APIs)' },
    { name: T_STAFF, description: 'Module 9: Staff registry, live GPS tracking, performance KPI & attendance (8 APIs)' },
    { name: T_SUPER, description: 'Module 10: Ward supervisor verification, job reopening & team task board (5 APIs)' },
    { name: T_REVIEWS, description: 'Module 11: Citizen public cleanliness reviews & feedback (4 APIs)' },
    { name: T_RATINGS, description: 'Module 12: Multi-parameter cleanliness, odor & water rating metrics (2 APIs)' },
    { name: T_NOTIF, description: 'Module 13: Real-time notification dispatch, unread badges & templates (4 APIs)' },
    { name: T_DASH, description: 'Module 14: Specialized executive summaries for Admin, Staff, Supervisor & Citizen (4 APIs)' },
    { name: T_ANALYTICS, description: 'Module 15: Resolution time SLAs, top problem areas, heatmaps & monthly trends (7 APIs)' },
    { name: T_REPORTS, description: 'Module 16: Daily/weekly/monthly reports & PDF/Excel exports (6 APIs)' },
    { name: T_MASTER, description: 'Module 17: System catalogues: cities, wards, categories, priorities & roles (11 APIs)' },
    { name: T_AI, description: 'Module 18: Simulated computer vision diagnosis, priority prediction & chatbot (9 APIs)' },
    { name: T_LOGS, description: 'Module 19: System-wide activity tracker, login history & error logs (4 APIs)' },
    { name: T_SETTINGS, description: 'Module 20: Super admin configurations: Email SMTP, SMS gateway, Push & Storage (10 APIs)' }
  ],
  paths: paths
};

module.exports = swaggerSpec;
