const db = require('../config/db');

exports.getDashboard = async (req, res, next) => {
  try {
    const supervisorId = req.user ? req.user.id : (req.query.supervisor_id || null);
    let ward = req.query.ward || null;
    if (!ward && supervisorId) {
      const sup = await db.get('SELECT ward_name FROM users WHERE id = ?', [supervisorId]);
      if (sup) ward = sup.ward_name;
    }

    const complaints = await db.all(
      `SELECT c.*, w.name as washroom_name, u.name as staff_name 
       FROM complaints c 
       LEFT JOIN washrooms w ON c.washroom_id = w.id 
       LEFT JOIN users u ON c.assigned_staff_id = u.id 
       WHERE (? IS NULL OR w.ward = ?) ORDER BY c.created_at DESC`,
      [ward, ward]
    );

    const pendingVerification = complaints.filter(c => c.status === 'Verification Pending');
    const activeTasks = await db.all(
      `SELECT t.*, u.name as staff_name FROM cleaning_tasks t LEFT JOIN users u ON t.staff_id = u.id WHERE t.status = 'In Progress'`
    );

    res.status(200).json({
      success: true,
      supervisor_ward: ward || 'All Wards',
      total_ward_complaints: complaints.length,
      pending_verification_count: pendingVerification.length,
      pending_verification_queue: pendingVerification,
      active_cleaning_tasks: activeTasks
    });
  } catch (err) {
    next(err);
  }
};

exports.getTeam = async (req, res, next) => {
  try {
    const ward = req.query.ward || (req.user ? req.user.ward_name : null);
    let query = 'SELECT id, name, email, phone, ward_name, assigned_area, status FROM users WHERE role = "STAFF"';
    const params = [];
    if (ward) { query += ' AND ward_name = ?'; params.push(ward); }
    const team = await db.all(query, params);
    res.status(200).json({ success: true, count: team.length, team });
  } catch (err) {
    next(err);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const supervisorId = req.user ? req.user.id : (req.query.supervisor_id || null);
    let query = `
      SELECT t.*, w.name as washroom_name, u.name as staff_name
      FROM cleaning_tasks t
      LEFT JOIN washrooms w ON t.washroom_id = w.id
      LEFT JOIN users u ON t.staff_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (supervisorId) { query += ' AND t.supervisor_id = ?'; params.push(supervisorId); }
    const tasks = await db.all(query, params);
    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    next(err);
  }
};

exports.verifyComplaint = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const c = await db.get('SELECT status FROM complaints WHERE id = ?', [req.params.id]);
    if (!c) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    await db.run(`UPDATE complaints SET status = 'Resolved', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [req.params.id]);
    
    const changedBy = req.user ? req.user.id : null;
    await db.run(`INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by_user_id, notes) VALUES (?, ?, 'Resolved', ?, ?)`, [req.params.id, c.status, changedBy, notes || 'Verified and approved by supervisor']);
    await db.run(`INSERT INTO complaint_logs (complaint_id, previous_status, new_status, changed_by_user_id, notes) VALUES (?, ?, 'Resolved', ?, ?)`, [req.params.id, c.status, changedBy, notes || 'Verified and approved by supervisor']);

    res.status(200).json({ success: true, message: 'Complaint verified and resolved!' });
  } catch (err) {
    next(err);
  }
};

exports.reopenComplaint = async (req, res, next) => {
  try {
    const { reason = 'Unsatisfactory cleaning work' } = req.body;
    const c = await db.get('SELECT status FROM complaints WHERE id = ?', [req.params.id]);
    if (!c) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    await db.run(`UPDATE complaints SET status = 'In Progress', rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [reason, req.params.id]);
    
    const changedBy = req.user ? req.user.id : null;
    await db.run(`INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by_user_id, notes) VALUES (?, ?, 'In Progress', ?, ?)`, [req.params.id, c.status, changedBy, `Reopened: ${reason}`]);
    await db.run(`INSERT INTO complaint_logs (complaint_id, previous_status, new_status, changed_by_user_id, notes) VALUES (?, ?, 'In Progress', ?, ?)`, [req.params.id, c.status, changedBy, `Reopened: ${reason}`]);

    res.status(200).json({ success: true, message: 'Complaint reopened and assigned back to staff.' });
  } catch (err) {
    next(err);
  }
};
