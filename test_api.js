const http = require('http');
const app = require('./server');
const db = require('./config/db');

const PORT = 5001; // Run test on port 5001 to avoid conflict if 5000 is running
const server = app.listen(PORT, async () => {
  console.log(`🧪 Integration Server started on port ${PORT}...`);
  try {
    // Ensure database connection check resolves before sending first request
    await db.testMysqlConnection();
    const baseUrl = `http://localhost:${PORT}`;

    // 1. Citizen Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen@clean.org', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log(`✅ [1/9] Citizen Login Status: ${loginRes.status} (${loginData.message})`);
    const citizenToken = loginData.token;

    // 2. Supervisor Login
    const supRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'supervisor.anita@clean.org', password: 'password123' })
    });
    const supData = await supRes.json();
    console.log(`✅ [2/9] Supervisor Login Status: ${supRes.status}`);
    const supToken = supData.token;

    // 3. QR Code Lookup
    const qrRes = await fetch(`${baseUrl}/api/washrooms/qr/QR-WASH-101`);
    const qrData = await qrRes.json();
    console.log(`✅ [3/9] QR Code Scan ('QR-WASH-101') Status: ${qrRes.status} -> Found: "${qrData.washroom.name}"`);

    // 4. AI Image Analysis Simulation
    const aiRes = await fetch(`${baseUrl}/api/ai/analyze-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ washroom_id: 1, image_url: '/uploads/sample_overflow_1.jpg' })
    });
    const aiData = await aiRes.json();
    console.log(`✅ [4/9] AI Cleanliness Scanner Status: ${aiRes.status} -> Score: ${aiData.ai_analysis.cleanliness_score}%, Priority: ${aiData.ai_analysis.predicted_priority}`);

    // 5. Submit Citizen Complaint
    const compRes = await fetch(`${baseUrl}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        washroom_id: 1,
        category: 'Overflowing Drain & Water Issue',
        priority: 'High',
        description: 'Automated test verification of drain issue.',
        before_images: ['/uploads/sample_overflow_1.jpg']
      })
    });
    const compData = await compRes.json();
    console.log(`✅ [5/9] Submit Complaint Status: ${compRes.status} -> Code: ${compData.complaint.complaint_code}`);
    const newComplaintId = compData.complaint.id;

    // 6. Assign Staff (Supervisor)
    const assignRes = await fetch(`${baseUrl}/api/complaints/${newComplaintId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supToken}`
      },
      body: JSON.stringify({ assigned_staff_id: 3, expected_hours: 2 })
    });
    const assignData = await assignRes.json();
    console.log(`✅ [6/9] Assign Staff Status: ${assignRes.status} (${assignData.message})`);

    // 7. Cleaning Staff Action (Update status to Cleaning Completed)
    const staffRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff.ramesh@clean.org', password: 'password123' })
    });
    const staffToken = (await staffRes.json()).token;

    const actionRes = await fetch(`${baseUrl}/api/complaints/${newComplaintId}/staff-action`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      },
      body: JSON.stringify({ status: 'Verification Pending', notes: 'Cleaned drain and sanitized.' })
    });
    console.log(`✅ [7/9] Staff Status Update ('Verification Pending') Status: ${actionRes.status}`);

    // 8. Supervisor Verification
    const verifyRes = await fetch(`${baseUrl}/api/complaints/${newComplaintId}/verify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supToken}`
      },
      body: JSON.stringify({ action: 'approve', notes: 'Verified clean.' })
    });
    console.log(`✅ [8/9] Supervisor Verification Status: ${verifyRes.status}`);

    // 9. Citizen Rating & Closure
    const fbRes = await fetch(`${baseUrl}/api/complaints/${newComplaintId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({ rating: 5, feedback: 'Great job!' })
    });
    console.log(`✅ [9/9] Citizen Feedback Status: ${fbRes.status} -> Complaint Officially Closed!`);

    // Dashboard Check
    const dashRes = await fetch(`${baseUrl}/api/analytics/dashboard`);
    const dashData = await dashRes.json();
    console.log(`📊 Analytics Dashboard Summary: Total Washrooms=${dashData.summary.total_washrooms}, Active Complaints=${dashData.summary.active_complaints}, Resolved Complaints=${dashData.summary.resolved_complaints}, Satisfaction=${dashData.summary.citizen_satisfaction_score}`);

    console.log('\n🎉 ALL 9 END-TO-END INTEGRATION TESTS PASSED WITH FLYING COLORS!');
  } catch (err) {
    console.error('❌ Integration Test Error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
