require('dotenv').config();
const http = require('http');
const app = require('./server');
const db = require('./config/db');

const TEST_PORT = 5055;
let server;
let token = '';

async function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: TEST_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (e) {}
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runAllTests() {
  console.log('🔄 Initializing Database & launching Test Server...');
  await db.testMysqlConnection();

  server = app.listen(TEST_PORT, async () => {
    console.log(`🚀 Test Server listening on port ${TEST_PORT}\n`);
    console.log('================================================================');
    console.log('🧪 RUNNING 20-MODULE ENTERPRISE E2E TEST SUITE');
    console.log('================================================================\n');

    let passed = 0;
    let failed = 0;
    const results = [];

    async function testEndpoint(moduleName, method, path, body = null, requiresAuth = false, expectedStatuses = [200, 201]) {
      const headers = requiresAuth && token ? { 'Authorization': `Bearer ${token}` } : {};
      try {
        const res = await makeRequest(method, path, body, headers);
        const isSuccess = expectedStatuses.includes(res.status);
        if (isSuccess) passed++;
        else failed++;

        const statusIcon = isSuccess ? '✅ PASS' : '❌ FAIL';
        console.log(`${statusIcon} [${moduleName}] ${method} ${path} -> Status: ${res.status}`);
        results.push({ moduleName, method, path, status: res.status, success: isSuccess });
        return res;
      } catch (err) {
        failed++;
        console.log(`❌ FAIL [${moduleName}] ${method} ${path} -> Error: ${err.message}`);
        results.push({ moduleName, method, path, status: 'ERROR', success: false });
        return null;
      }
    }

    // Module 1: Auth Module
    console.log('--- Module 1: Authentication Module ---');
    const loginRes = await testEndpoint('M01: Auth', 'POST', '/api/auth/login', { email: 'admin.vikram@clean.org', password: 'password123' });
    if (loginRes && loginRes.data && loginRes.data.token) {
      token = loginRes.data.token;
    }
    await testEndpoint('M01: Auth', 'GET', '/api/auth/me', null, true);
    await testEndpoint('M01: Auth', 'POST', '/api/auth/send-otp', { email_or_phone: 'citizen@clean.org' });

    // Module 2: User Management
    console.log('\n--- Module 2: User Management Module ---');
    await testEndpoint('M02: Users', 'GET', '/api/users', null, true);
    await testEndpoint('M02: Users', 'GET', '/api/users/search?q=Citizen', null, true);
    await testEndpoint('M02: Users', 'GET', '/api/users/1', null, true);

    // Module 3: Public Washroom Module
    console.log('\n--- Module 3: Public Washroom Module ---');
    await testEndpoint('M03: Washrooms', 'GET', '/api/washrooms');
    await testEndpoint('M03: Washrooms', 'GET', '/api/washrooms/nearby?lat=19.0760&lng=72.8777&radiusKm=10');
    await testEndpoint('M03: Washrooms', 'GET', '/api/washrooms/search?q=Station');
    await testEndpoint('M03: Washrooms', 'GET', '/api/washrooms/map');
    await testEndpoint('M03: Washrooms', 'GET', '/api/washrooms/1');
    await testEndpoint('M03: Washrooms', 'GET', '/api/washrooms/1/images');

    // Module 4: Facility Module
    console.log('\n--- Module 4: Facility Module ---');
    await testEndpoint('M04: Facilities', 'GET', '/api/facilities');

    // Module 5: Complaint Module
    console.log('\n--- Module 5: Complaint Module ---');
    await testEndpoint('M05: Complaints', 'GET', '/api/complaints');
    await testEndpoint('M05: Complaints', 'GET', '/api/complaints/history', null, true);
    await testEndpoint('M05: Complaints', 'GET', '/api/complaints/1');
    await testEndpoint('M05: Complaints', 'GET', '/api/complaints/timeline/1');

    // Module 6: Complaint Media Module
    console.log('\n--- Module 6: Complaint Media Module ---');
    await testEndpoint('M06: Media', 'GET', '/api/complaints/1/media');

    // Module 7: QR Code Engine
    console.log('\n--- Module 7: QR Code Engine ---');
    await testEndpoint('M07: QR', 'GET', '/api/qr/1');
    await testEndpoint('M07: QR', 'POST', '/api/qr/scan', { code_id: 'QR-WASH-101' });

    // Module 8: Cleaning Task Module
    console.log('\n--- Module 8: Cleaning Task Module ---');
    await testEndpoint('M08: Tasks', 'GET', '/api/tasks');

    // Module 9: Staff Module
    console.log('\n--- Module 9: Staff Module ---');
    await testEndpoint('M09: Staff', 'GET', '/api/staff', null, true);
    await testEndpoint('M09: Staff', 'GET', '/api/staff/performance', null, true);
    await testEndpoint('M09: Staff', 'GET', '/api/staff/attendance', null, true);

    // Module 10: Supervisor Module
    console.log('\n--- Module 10: Supervisor Module ---');
    await testEndpoint('M10: Supervisor', 'GET', '/api/supervisor/dashboard', null, true);
    await testEndpoint('M10: Supervisor', 'GET', '/api/supervisor/team', null, true);
    await testEndpoint('M10: Supervisor', 'GET', '/api/supervisor/tasks', null, true);

    // Module 11: Review Module
    console.log('\n--- Module 11: Review Module ---');
    await testEndpoint('M11: Reviews', 'GET', '/api/reviews');

    // Module 12: Rating Module
    console.log('\n--- Module 12: Rating Module ---');
    await testEndpoint('M12: Ratings', 'GET', '/api/ratings');

    // Module 13: Notification Module
    console.log('\n--- Module 13: Notification Module ---');
    await testEndpoint('M13: Notifications', 'GET', '/api/notifications', null, true);

    // Module 14: Dashboard Module
    console.log('\n--- Module 14: Dashboard Module ---');
    await testEndpoint('M14: Dashboard', 'GET', '/api/dashboard/admin', null, true);
    await testEndpoint('M14: Dashboard', 'GET', '/api/dashboard/staff', null, true);
    await testEndpoint('M14: Dashboard', 'GET', '/api/dashboard/citizen', null, true);

    // Module 15: Analytics & Heatmap Module
    console.log('\n--- Module 15: Analytics Module ---');
    await testEndpoint('M15: Analytics', 'GET', '/api/analytics/dashboard', null, true);
    await testEndpoint('M15: Analytics', 'GET', '/api/analytics/complaints', null, true);
    await testEndpoint('M15: Analytics', 'GET', '/api/analytics/resolution-time', null, true);
    await testEndpoint('M15: Analytics', 'GET', '/api/analytics/top-problem-areas', null, true);
    await testEndpoint('M15: Analytics', 'GET', '/api/analytics/heatmap', null, true);
    await testEndpoint('M15: Analytics', 'GET', '/api/analytics/monthly', null, true);

    // Module 16: Report Export Module
    console.log('\n--- Module 16: Report Export Module ---');
    await testEndpoint('M16: Reports', 'GET', '/api/reports/daily', null, true);
    await testEndpoint('M16: Reports', 'GET', '/api/reports/export/pdf', null, true);
    await testEndpoint('M16: Reports', 'GET', '/api/reports/export/excel', null, true);

    // Module 17: Master Data Catalogues
    console.log('\n--- Module 17: Master Catalogues ---');
    await testEndpoint('M17: Master', 'GET', '/api/master/categories');
    await testEndpoint('M17: Master', 'GET', '/api/master/status');
    await testEndpoint('M17: Master', 'GET', '/api/master/cities');
    await testEndpoint('M17: Master', 'GET', '/api/master/wards');
    await testEndpoint('M17: Master', 'GET', '/api/master/priority');

    // Module 18: AI Vision & Chat Engine
    console.log('\n--- Module 18: AI Vision & Chat Engine ---');
    await testEndpoint('M18: AI Engine', 'POST', '/api/ai/detect-dirty', { image_url: '/uploads/demo_dirty.jpg' });
    await testEndpoint('M18: AI Engine', 'POST', '/api/ai/chat', { message: 'How do I submit a washroom complaint?' });
    await testEndpoint('M18: AI Engine', 'POST', '/api/ai/priority', { category: 'Blocked/Overflowing Toilet', description: 'Urgent overflow issue' });

    // Module 19: System & Audit Logs
    console.log('\n--- Module 19: Audit Logs Module ---');
    await testEndpoint('M19: Logs', 'GET', '/api/logs', null, true);
    await testEndpoint('M19: Logs', 'GET', '/api/logs/login', null, true);
    await testEndpoint('M19: Logs', 'GET', '/api/logs/activity', null, true);
    await testEndpoint('M19: Logs', 'GET', '/api/logs/error', null, true);

    // Module 20: System Settings
    console.log('\n--- Module 20: System Settings ---');
    await testEndpoint('M20: Settings', 'GET', '/api/settings', null, true);
    await testEndpoint('M20: Settings', 'GET', '/api/settings/email', null, true);

    console.log('\n================================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  });
}

runAllTests().catch(err => {
  console.error('❌ Test execution failed:', err);
  if (server) server.close();
  process.exit(1);
});
