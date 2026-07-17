const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getAllStaff = async (req, res, next) => {
  try {
    const { ward, status } = req.query;
    let query = 'SELECT id, name, email, phone, role, ward_name, assigned_area, civic_points, status, created_at FROM users WHERE role = "STAFF"';
    const params = [];
    if (ward) { query += ' AND ward_name = ?'; params.push(ward); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY name ASC';
    const staff = await db.all(query, params);
    res.status(200).json({ success: true, count: staff.length, staff });
  } catch (err) {
    next(err);
  }
};

exports.getStaffPerformance = async (req, res, next) => {
  try {
    const staffId = req.query.staff_id || (req.user && req.user.role === 'STAFF' ? req.user.id : null);
    let query = `
      SELECT u.id as staff_id, u.name, u.ward_name,
             COUNT(c.id) as total_assigned,
             SUM(CASE WHEN c.status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as resolved_count,
             AVG(c.ai_cleanliness_score) as avg_ai_score
      FROM users u
      LEFT JOIN complaints c ON u.id = c.assigned_staff_id
      WHERE u.role = 'STAFF'
    `;
    const params = [];
    if (staffId) {
      query += ' AND u.id = ?';
      params.push(staffId);
    }
    query += ' GROUP BY u.id, u.name, u.ward_name';
    const performance = await db.all(query, params);
    res.status(200).json({ success: true, count: performance.length, performance });
  } catch (err) {
    next(err);
  }
};

exports.getStaffAttendance = async (req, res, next) => {
  try {
    const { staff_id, date } = req.query;
    let query = `
      SELECT a.*, u.name as staff_name, u.ward_name 
      FROM staff_attendance a 
      LEFT JOIN users u ON a.staff_id = u.id 
      WHERE 1=1
    `;
    const params = [];
    if (staff_id) { query += ' AND a.staff_id = ?'; params.push(staff_id); }
    if (date) { query += ' AND a.date = ?'; params.push(date); }
    query += ' ORDER BY a.date DESC LIMIT 100';
    const attendance = await db.all(query, params);
    res.status(200).json({ success: true, count: attendance.length, attendance });
  } catch (err) {
    next(err);
  }
};

exports.getStaffById = async (req, res, next) => {
  try {
    const staff = await db.get('SELECT id, name, email, phone, role, ward_name, assigned_area, civic_points, status FROM users WHERE id = ? AND role = "STAFF"', [req.params.id]);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found.' });

    const tasks = await db.all('SELECT * FROM cleaning_tasks WHERE staff_id = ? ORDER BY id DESC LIMIT 20', [staff.id]);
    const attendance = await db.all('SELECT * FROM staff_attendance WHERE staff_id = ? ORDER BY date DESC LIMIT 10', [staff.id]);
    const location = await db.get('SELECT * FROM staff_locations WHERE staff_id = ? ORDER BY id DESC LIMIT 1', [staff.id]);

    res.status(200).json({ success: true, staff: { ...staff, tasks, attendance, latest_location: location || null } });
  } catch (err) {
    next(err);
  }
};

exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, password, phone, ward_name, assigned_area } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password required.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.run(
      `INSERT INTO users (name, email, phone, password_hash, role, ward_name, assigned_area, status) VALUES (?, ?, ?, ?, 'STAFF', ?, ?, 'Active')`,
      [name, email, phone || null, hashed, ward_name || null, assigned_area || null]
    );
    res.status(201).json({ success: true, message: 'Staff registered.', staff: { id: result.lastInsertRowid, name, email, role: 'STAFF', ward_name } });
  } catch (err) {
    next(err);
  }
};

exports.updateStaff = async (req, res, next) => {
  try {
    const { name, phone, ward_name, assigned_area, status } = req.body;
    await db.run(
      `UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), ward_name = COALESCE(?, ward_name), assigned_area = COALESCE(?, assigned_area), status = COALESCE(?, status) WHERE id = ? AND role = 'STAFF'`,
      [name || null, phone || null, ward_name || null, assigned_area || null, status || null, req.params.id]
    );
    const updated = await db.get('SELECT id, name, email, phone, ward_name, assigned_area, status FROM users WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Staff updated.', staff: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteStaff = async (req, res, next) => {
  try {
    await db.run('DELETE FROM users WHERE id = ? AND role = "STAFF"', [req.params.id]);
    res.status(200).json({ success: true, message: 'Staff member deleted.' });
  } catch (err) {
    next(err);
  }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy_meters } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'latitude and longitude required.' });
    }
    await db.run(
      'INSERT INTO staff_locations (staff_id, latitude, longitude, accuracy_meters) VALUES (?, ?, ?, ?)',
      [req.params.id, latitude, longitude, accuracy_meters || null]
    );
    res.status(200).json({ success: true, message: 'Live GPS location updated.' });
  } catch (err) {
    next(err);
  }
};
