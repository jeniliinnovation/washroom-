const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seedDatabase() {
  console.log('🌱 Starting 20-Module Enterprise database seeding for Smart Public Washroom Complaint System...');

  // 1. Read and execute schema.sql
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  await db.exec(schemaSql);
  console.log('✅ 32 Tables created successfully from schema.sql');

  // 2. Hash default password
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // 3. Seed Roles & Permissions
  const roles = [
    { name: 'CITIZEN', desc: 'Civic citizen reporting issues and reviewing washrooms' },
    { name: 'STAFF', desc: 'Cleaning and maintenance staff performing scheduled shifts' },
    { name: 'SUPERVISOR', desc: 'Ward supervisor verifying resolutions and managing teams' },
    { name: 'ADMIN', desc: 'Municipality administrator managing public infrastructure' },
    { name: 'SUPER_ADMIN', desc: 'Global system controller and configuration master' }
  ];
  for (const r of roles) {
    await db.run(`INSERT INTO roles (name, description) VALUES (?, ?)`, [r.name, r.desc]);
  }

  const permissions = [
    { name: 'COMPLAINT_CREATE', mod: 'Complaints', desc: 'Can submit new complaints' },
    { name: 'COMPLAINT_ASSIGN', mod: 'Complaints', desc: 'Can assign staff to complaints' },
    { name: 'COMPLAINT_VERIFY', mod: 'Complaints', desc: 'Can verify completed jobs' },
    { name: 'WASHROOM_MANAGE', mod: 'Washrooms', desc: 'Can add/edit/delete washrooms' },
    { name: 'ANALYTICS_VIEW', mod: 'Analytics', desc: 'Can view municipal dashboards and export reports' }
  ];
  for (const p of permissions) {
    await db.run(`INSERT INTO permissions (name, module, description) VALUES (?, ?, ?)`, [p.name, p.mod, p.desc]);
  }

  // 4. Seed Users
  const users = [
    { name: 'Rahul Sharma (Citizen)', email: 'citizen@clean.org', phone: '+91 9876543210', role: 'CITIZEN', ward: 'Ward 4 - Central Station', area: 'Central', points: 120 },
    { name: 'Priya Patel (Citizen)', email: 'priya@clean.org', phone: '+91 9876543211', role: 'CITIZEN', ward: 'Ward 2 - Market Complex', area: 'Market', points: 85 },
    { name: 'Ramesh Kumar (Cleaning Staff)', email: 'staff.ramesh@clean.org', phone: '+91 9811122233', role: 'STAFF', ward: 'Ward 4 - Central Station', area: 'Platform 1-4 Area', points: 210 },
    { name: 'Suresh Yadav (Cleaning Staff)', email: 'staff.suresh@clean.org', phone: '+91 9811122234', role: 'STAFF', ward: 'Ward 2 - Market Complex', area: 'South Market Block', points: 195 },
    { name: 'Anita Verma (Supervisor)', email: 'supervisor.anita@clean.org', phone: '+91 9822233344', role: 'SUPERVISOR', ward: 'Ward 4 - Central Station', area: 'Zone A & B', points: 300 },
    { name: 'Vikram Singh (Municipality Admin)', email: 'admin.vikram@clean.org', phone: '+91 9833344455', role: 'ADMIN', ward: 'Central Municipal Corporation', area: 'City-wide', points: 500 },
    { name: 'Super Admin', email: 'superadmin@clean.org', phone: '+91 9999999999', role: 'SUPER_ADMIN', ward: 'Headquarters', area: 'All Municipalities', points: 1000 }
  ];

  for (const u of users) {
    await db.run(
      `INSERT INTO users (name, email, phone, password_hash, role, ward_name, assigned_area, civic_points) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.name, u.email, u.phone, defaultPasswordHash, u.role, u.ward, u.area, u.points]
    );
  }
  console.log('✅ 7 Demo Users seeded (Password for all: password123)');

  // 5. Seed States, Cities, Wards & Areas
  const resState = await db.run(`INSERT INTO states (name, code) VALUES ('Delhi', 'DL')`);
  const resCity = await db.run(`INSERT INTO cities (state_id, name, pincode) VALUES (?, 'New Delhi', '110001')`, [resState.lastInsertRowid || 1]);
  const resWard1 = await db.run(`INSERT INTO wards (city_id, name, ward_number) VALUES (?, 'Ward 4 - Central Station', 'W-004')`, [resCity.lastInsertRowid || 1]);
  const resWard2 = await db.run(`INSERT INTO wards (city_id, name, ward_number) VALUES (?, 'Ward 2 - Market Complex', 'W-002')`, [resCity.lastInsertRowid || 1]);
  await db.run(`INSERT INTO areas (ward_id, name, landmark) VALUES (?, 'Central Railway Concourse', 'Near Gate 1')`, [resWard1.lastInsertRowid || 1]);
  await db.run(`INSERT INTO areas (ward_id, name, landmark) VALUES (?, 'Connaught Place Inner Circle', 'Block C')`, [resWard2.lastInsertRowid || 1]);

  // 6. Seed Master Facilities
  const facilities = [
    { name: 'Wheelchair Access', icon: '♿', desc: 'Ramp and spacious cubicle for wheelchair users' },
    { name: 'Baby Changing Station', icon: '👶', desc: 'Foldable table for infant diaper changing' },
    { name: 'Drinking Water', icon: '🚰', desc: 'RO filtered clean drinking water tap exterior' },
    { name: 'Parking Available', icon: '🅿️', desc: 'Adjacent 2-wheeler and 4-wheeler parking slots' },
    { name: 'Female Washroom Section', icon: '🚺', desc: 'Dedicated female toilet cubicles with sanitary disposal' },
    { name: 'Male Washroom Section', icon: '🚹', desc: 'Dedicated urinal and male cubicles' },
    { name: 'Family Washroom', icon: '👪', desc: 'Private gender-neutral family convenience room' }
  ];
  for (const f of facilities) {
    await db.run(`INSERT INTO facilities (name, icon, description) VALUES (?, ?, ?)`, [f.name, f.icon, f.desc]);
  }

  // 7. Seed Public Washrooms
  const washrooms = [
    {
      name: 'Central Railway Station Public Toilet - Gate 1',
      address: 'Near Platform 1 Concourse, Central Station Road',
      ward: 'Ward 4 - Central Station',
      area: 'Central Railway Concourse',
      lat: 28.6139, lng: 77.2090,
      qr: 'QR-WASH-101',
      cleanliness: 42,
      status: 'Active',
      facilities: JSON.stringify(['Wheelchair Access', 'Drinking Water', 'Female Washroom Section', 'Male Washroom Section']),
      hours: '24/7',
      ratings: 18,
      avg: 3.4
    },
    {
      name: 'Connaught Place Market Complex - Block C Washroom',
      address: 'Inner Circle Block C, Behind Metro Gate 3',
      ward: 'Ward 2 - Market Complex',
      area: 'Connaught Place Inner Circle',
      lat: 28.6315, lng: 77.2167,
      qr: 'QR-WASH-102',
      cleanliness: 92,
      status: 'Active',
      facilities: JSON.stringify(['Wheelchair Access', 'Baby Changing Station', 'Drinking Water', 'Female Washroom Section', 'Male Washroom Section', 'Family Washroom']),
      hours: '06:00 AM - 11:00 PM',
      ratings: 45,
      avg: 4.7
    },
    {
      name: 'Lodhi Garden Public Convenience - South Gate',
      address: 'Opposite India International Centre, Lodhi Estate',
      ward: 'Ward 1 - City Park',
      area: 'Lodhi Estate',
      lat: 28.5888, lng: 77.2215,
      qr: 'QR-WASH-103',
      cleanliness: 88,
      status: 'Active',
      facilities: JSON.stringify(['Wheelchair Access', 'Female Washroom Section', 'Male Washroom Section']),
      hours: '05:00 AM - 09:00 PM',
      ratings: 22,
      avg: 4.3
    },
    {
      name: 'ISBT Kashmiri Gate Bus Terminal - Bay 12 Toilet',
      address: 'Interstate Bus Terminal Departure Concourse',
      ward: 'Ward 5 - Highway Bus Stand',
      area: 'ISBT Departure Bay',
      lat: 28.6675, lng: 77.2285,
      qr: 'QR-WASH-104',
      cleanliness: 28,
      status: 'Active',
      facilities: JSON.stringify(['Female Washroom Section', 'Male Washroom Section']),
      hours: '24/7',
      ratings: 39,
      avg: 2.1
    },
    {
      name: 'Janpath Heritage Plaza - Basement Washroom',
      address: 'Janpath Market Complex, Near Cottage Emporium',
      ward: 'Ward 3 - Heritage Plaza',
      area: 'Janpath Market',
      lat: 28.6255, lng: 77.2180,
      qr: 'QR-WASH-105',
      cleanliness: 76,
      status: 'Maintenance',
      facilities: JSON.stringify(['Wheelchair Access', 'Drinking Water']),
      hours: '08:00 AM - 10:00 PM',
      ratings: 14,
      avg: 3.8
    },
    {
      name: 'Cyber Hub Metro Link Washroom #2',
      address: 'Skywalk Junction near Metro Gate 2',
      ward: 'Ward 6 - Tech Park Metro',
      area: 'Cyber Hub Skywalk',
      lat: 28.4950, lng: 77.0895,
      qr: 'QR-WASH-106',
      cleanliness: 95,
      status: 'Active',
      facilities: JSON.stringify(['Wheelchair Access', 'Baby Changing Station', 'Family Washroom', 'Parking Available']),
      hours: '24/7',
      ratings: 62,
      avg: 4.9
    }
  ];

  for (const w of washrooms) {
    const res = await db.run(
      `INSERT INTO washrooms (name, address, ward, area, latitude, longitude, qr_code_id, cleanliness_score, status, facilities_json, opening_hours, total_ratings, avg_rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [w.name, w.address, w.ward, w.area, w.lat, w.lng, w.qr, w.cleanliness, w.status, w.facilities, w.hours, w.ratings, w.avg]
    );
    const wId = res.lastInsertRowid || 1;

    // Assign facilities to washroom_facilities mapping table
    await db.run(`INSERT INTO washroom_facilities (washroom_id, facility_id) VALUES (?, 1), (?, 3)`, [wId, wId]);
    
    // Also seed QR codes catalog
    await db.run(`INSERT INTO qr_codes (code_id, washroom_id, scans_count) VALUES (?, ?, 15)`, [w.qr, wId]);
  }
  console.log('✅ 6 Public Washrooms, Facilities mapping & QR Catalog seeded');

  // 8. Seed Complaint Categories & Priorities
  const categories = [
    { name: 'Overflowing Drain & Flooding', sla: 4, desc: 'Water drain blockage or standing dirty water' },
    { name: 'Broken Toilet Seat / Door Lock', sla: 12, desc: 'Physical damage to seat, flush handle, or cubicle lock' },
    { name: 'Bad Odor & Unsanitary Floor', sla: 6, desc: 'Severe smell, garbage overflow, or uncleaned floor' },
    { name: 'No Water Supply / Tap Broken', sla: 4, desc: 'No water in washbasins or flush tanks' },
    { name: 'Soap / Tissue Dispenser Empty', sla: 12, desc: 'Missing handwash liquid or paper towels' },
    { name: 'Electricity / Lighting Issue', sla: 24, desc: 'Dark cubicles or non-functional exhaust fans' }
  ];
  for (const c of categories) {
    await db.run(`INSERT INTO complaint_categories (name, sla_hours, description) VALUES (?, ?, ?)`, [c.name, c.sla, c.desc]);
  }

  const priorities = [
    { name: 'Low', level: 1 },
    { name: 'Medium', level: 2 },
    { name: 'High', level: 3 },
    { name: 'Urgent', level: 4 }
  ];
  for (const p of priorities) {
    await db.run(`INSERT INTO priorities (name, level) VALUES (?, ?)`, [p.name, p.level]);
  }

  // 9. Seed Complaints & Status History & Logs
  const complaints = [
    {
      code: 'PWMS-2026-0001',
      citizen_id: 1,
      washroom_id: 1,
      category: 'Overflowing Drain & Flooding',
      priority: 'Urgent',
      description: 'Water is backing up near the washbasins and the floor drain is clogged.',
      status: 'New Complaint',
      before_images: JSON.stringify(['/uploads/sample_overflow_1.jpg']),
      after_images: JSON.stringify([]),
      lat: 28.6139, lng: 77.2090,
      ai_score: 31,
      ai_issues: JSON.stringify(['Overflowing Water Detected', 'Floor Flooding Hazard'])
    },
    {
      code: 'PWMS-2026-0002',
      citizen_id: 2,
      washroom_id: 4,
      category: 'Bad Odor & Unsanitary Floor',
      priority: 'High',
      description: 'Extremely foul smell inside the men and women sections, garbage bins are overflowing.',
      status: 'Assigned',
      before_images: JSON.stringify(['/uploads/sample_dirty_2.jpg']),
      after_images: JSON.stringify([]),
      lat: 28.6675, lng: 77.2285,
      staff_id: 3,
      supervisor_id: 5,
      ai_score: 22,
      ai_issues: JSON.stringify(['Garbage Overflow Detected', 'High Odor Risk'])
    },
    {
      code: 'PWMS-2026-0003',
      citizen_id: 1,
      washroom_id: 1,
      category: 'Broken Toilet Seat / Door Lock',
      priority: 'Medium',
      description: 'The toilet seat in cubicle #3 is cracked and unusable.',
      status: 'Verification Pending',
      before_images: JSON.stringify(['/uploads/sample_broken_seat_before.jpg']),
      after_images: JSON.stringify(['/uploads/sample_broken_seat_after.jpg']),
      lat: 28.6140, lng: 77.2091,
      staff_id: 3,
      supervisor_id: 5,
      ai_score: 65,
      ai_issues: JSON.stringify(['Damaged Fixture/Seat'])
    },
    {
      code: 'PWMS-2026-0004',
      citizen_id: 2,
      washroom_id: 2,
      category: 'Soap / Tissue Dispenser Empty',
      priority: 'Low',
      description: 'Both liquid soap dispensers at the entrance washbasin are empty.',
      status: 'Closed',
      before_images: JSON.stringify(['/uploads/sample_soap_before.jpg']),
      after_images: JSON.stringify(['/uploads/sample_soap_after.jpg']),
      lat: 28.6315, lng: 77.2167,
      staff_id: 4,
      supervisor_id: 5,
      ai_score: 84,
      ai_issues: JSON.stringify(['Empty Dispenser Unit']),
      rating: 5,
      feedback: 'Quick response! Ramesh refilled the soap within 45 minutes.'
    }
  ];

  for (const c of complaints) {
    const res = await db.run(
      `INSERT INTO complaints (complaint_code, citizen_id, washroom_id, category, priority, description, status, before_images_json, after_images_json, gps_lat, gps_lng, assigned_staff_id, supervisor_id, ai_cleanliness_score, ai_detected_issues_json, citizen_rating, citizen_feedback)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.code, c.citizen_id, c.washroom_id, c.category, c.priority, c.description, c.status, c.before_images, c.after_images, c.lat, c.lng, c.staff_id || null, c.supervisor_id || null, c.ai_score, c.ai_issues, c.rating || null, c.feedback || null]
    );
    const compId = res.lastInsertRowid || 1;

    // Insert into both complaint_status_history and complaint_logs
    await db.run(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by_user_id, notes)
       VALUES (?, NULL, 'New Complaint', ?, 'Citizen submitted complaint')`,
      [compId, c.citizen_id]
    );
    await db.run(
      `INSERT INTO complaint_logs (complaint_id, previous_status, new_status, changed_by_user_id, notes)
       VALUES (?, NULL, 'New Complaint', ?, 'Citizen submitted complaint')`,
      [compId, c.citizen_id]
    );

    if (c.staff_id) {
      await db.run(`INSERT INTO complaint_assignments (complaint_id, assigned_staff_id, assigned_by_user_id, notes) VALUES (?, ?, ?, ?)`, [compId, c.staff_id, 5, 'Assigned by Supervisor']);
    }
  }
  console.log('✅ Complaints, Status History & Assignments seeded');

  // 10. Seed Cleaning Tasks Module
  await db.run(
    `INSERT INTO cleaning_tasks (task_code, washroom_id, staff_id, supervisor_id, task_type, status, notes)
     VALUES ('TASK-2026-101', 1, 3, 5, 'Morning Sanitization Shift', 'Completed', 'All cubicles sanitized and floors scrubbed.'),
            ('TASK-2026-102', 2, 4, 5, 'High Footfall Deep Cleaning', 'In Progress', 'Refilling paper dispensers and cleaning mirrors.')`
  );
  console.log('✅ Cleaning Tasks lifecycle seeded');

  // 11. Seed Staff Attendance & Locations & Leaves
  await db.run(
    `INSERT INTO staff_attendance (staff_id, date, check_in, check_out, status, tasks_completed)
     VALUES (3, ?, '08:00 AM', '04:00 PM', 'Present', 6), (4, ?, '08:30 AM', '04:30 PM', 'Present', 5)`,
    [new Date().toISOString().slice(0, 10), new Date().toISOString().slice(0, 10)]
  );
  await db.run(`INSERT INTO staff_locations (staff_id, latitude, longitude, accuracy_meters) VALUES (3, 28.6140, 77.2091, 5.2), (4, 28.6316, 77.2168, 4.0)`);
  await db.run(`INSERT INTO staff_leaves (staff_id, start_date, end_date, reason, status, supervisor_id) VALUES (4, '2026-07-25', '2026-07-26', 'Family medical checkup', 'Approved', 5)`);

  // 12. Seed Reviews & Ratings
  await db.run(`INSERT INTO reviews (washroom_id, citizen_id, rating, review_text) VALUES (1, 1, 4, 'Very clean after morning service.'), (2, 2, 5, 'Best public convenience in Connaught Place!')`);
  await db.run(`INSERT INTO washroom_reviews (washroom_id, citizen_id, rating, review_text) VALUES (1, 1, 4, 'Very clean after morning service.'), (2, 2, 5, 'Best public convenience in Connaught Place!')`);
  await db.run(`INSERT INTO ratings (washroom_id, cleanliness_rating, smell_rating, water_availability_rating, citizen_id) VALUES (1, 4, 3, 5, 1), (2, 5, 5, 5, 2)`);

  // 13. Seed Notifications & Templates
  await db.run(`INSERT INTO notifications (user_id, title, message, type) VALUES (3, 'New Job Assigned', 'You have been assigned urgent complaint PWMS-2026-0002 at ISBT Terminal.', 'TASK')`);
  await db.run(`INSERT INTO notification_templates (code, subject, body_template, channel) VALUES ('OTP_VERIFICATION', 'Your Clean Toilet Portal OTP Code', 'Your verification code is {{otp}}. Valid for 10 minutes.', 'EMAIL'), ('TASK_ASSIGNED', 'New Civic Task Assigned', 'Task {{task_code}} assigned at {{washroom_name}}.', 'ALL')`);

  // 14. Seed Settings & Audit Logs
  const settings = [
    { key: 'AI_AUTO_ROUTING_ENABLED', val: 'true', cat: 'AI', desc: 'Auto assign urgent issues to nearby staff' },
    { key: 'SMS_GATEWAY_ACTIVE', val: 'true', cat: 'SMS', desc: 'Send SMS notifications' },
    { key: 'MAX_EXPECTED_RESOLUTION_HOURS', val: '4', cat: 'GENERAL', desc: 'Default SLA timeout' },
    { key: 'STORAGE_PROVIDER', val: 'CLOUDINARY', cat: 'STORAGE', desc: 'Active media storage backend' }
  ];
  for (const s of settings) {
    await db.run(`INSERT INTO settings (setting_key, setting_value, category, description) VALUES (?, ?, ?, ?)`, [s.key, s.val, s.cat, s.desc]);
  }
  await db.run(`INSERT INTO audit_logs (user_id, action, target_type, target_id, details, ip_address) VALUES (7, 'SYSTEM_INITIALIZED', 'SYSTEM', 'ALL', 'Super Admin initialized expanded 20-Module Smart City Civic Platform', '127.0.0.1')`);

  console.log('🎉 Expanded 20-Module Enterprise Database seeding completed successfully!');
}

if (require.main === module) {
  seedDatabase().then(() => process.exit(0)).catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}

module.exports = seedDatabase;
