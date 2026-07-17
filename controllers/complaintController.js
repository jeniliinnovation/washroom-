const db = require('../config/db');
const { uploadImage } = require('../config/cloudinary');
const aiService = require('../services/aiService');

exports.submitComplaint = async (req, res, next) => {
  try {
    const {
      washroom_id,
      category,
      priority = 'Medium',
      description,
      is_anonymous = 0,
      before_images = [],
      gps_lat = null,
      gps_lng = null
    } = req.body;

    if (!washroom_id || !category) {
      return res.status(400).json({ success: false, message: 'Washroom ID and Category are required.' });
    }

    const citizenId = req.user && is_anonymous != 1 ? req.user.id : (req.body.citizen_id || null);
    const complaintCode = `PWMS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let imageUrls = [];
    if (Array.isArray(before_images)) {
      imageUrls = [...before_images];
    } else if (typeof before_images === 'string' && before_images.length > 0) {
      try { imageUrls = JSON.parse(before_images); } catch (e) { imageUrls = [before_images]; }
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadImage(file.path || file.buffer, file.originalname);
        if (url) imageUrls.push(url);
      }
    }

    let aiScore = null;
    let aiIssuesJson = null;
    let autoPriority = priority;
    if (imageUrls.length > 0) {
      const aiRes = await aiService.detectDirty(imageUrls[0]);
      aiScore = aiRes.cleanliness_score;
      aiIssuesJson = JSON.stringify(aiRes.detected_hazards);
      autoPriority = await aiService.predictPriority(category, description, aiScore);
    } else {
      autoPriority = await aiService.predictPriority(category, description, null);
    }

    // SLA hours determination
    const catMaster = await db.get('SELECT sla_hours FROM complaint_categories WHERE name = ?', [category]);
    const slaHours = catMaster ? catMaster.sla_hours : 24;

    const result = await db.run(
      `INSERT INTO complaints (
        complaint_code, citizen_id, washroom_id, category, priority, description, status,
        before_images_json, after_images_json, gps_lat, gps_lng, is_anonymous, ai_cleanliness_score, ai_detected_issues_json,
        expected_resolution_time
      ) VALUES (?, ?, ?, ?, ?, ?, 'New Complaint', ?, '[]', ?, ?, ?, ?, ?, DATETIME('now', ?))`,
      [
        complaintCode, citizenId, washroom_id, category, autoPriority, description || null,
        JSON.stringify(imageUrls), gps_lat, gps_lng, is_anonymous ? 1 : 0, aiScore, aiIssuesJson,
        `+${slaHours} hour`
      ]
    );

    const compId = result.lastInsertRowid;

    // Log status timeline
    await db.run(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by_user_id, notes) VALUES (?, NULL, 'New Complaint', ?, 'Complaint submitted')`,
      [compId, citizenId]
    );
    await db.run(
      `INSERT INTO complaint_logs (complaint_id, previous_status, new_status, changed_by_user_id, notes) VALUES (?, NULL, 'New Complaint', ?, 'Complaint submitted')`,
      [compId, citizenId]
    );

    // Also catalog uploaded media into complaint_media table
    for (const img of imageUrls) {
      await db.run(
        `INSERT INTO complaint_media (complaint_id, media_type, media_url, stage, uploaded_by_user_id) VALUES (?, 'PHOTO', ?, 'BEFORE', ?)`,
        [compId, img, citizenId]
      );
    }

    if (citizenId) {
      await db.run('UPDATE users SET civic_points = civic_points + 10 WHERE id = ?', [citizenId]);
    }

    const newComplaint = await db.get('SELECT * FROM complaints WHERE id = ?', [compId]);

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully! +10 Civic Points awarded.',
      complaint: {
        ...newComplaint,
        before_images: imageUrls,
        after_images: [],
        ai_cleanliness_score: aiScore
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllComplaints = async (req, res, next) => {
  try {
    const { status, ward, priority, category, assigned_staff_id } = req.query;
    let query = `
      SELECT c.*, w.name as washroom_name, w.address, w.ward, u.name as citizen_name, s.name as staff_name, sup.name as supervisor_name
      FROM complaints c
      LEFT JOIN washrooms w ON c.washroom_id = w.id
      LEFT JOIN users u ON c.citizen_id = u.id
      LEFT JOIN users s ON c.assigned_staff_id = s.id
      LEFT JOIN users sup ON c.supervisor_id = sup.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }
    if (ward) {
      query += ' AND w.ward = ?';
      params.push(ward);
    }
    if (priority) {
      query += ' AND c.priority = ?';
      params.push(priority);
    }
    if (category) {
      query += ' AND c.category = ?';
      params.push(category);
    }
    if (assigned_staff_id) {
      query += ' AND c.assigned_staff_id = ?';
      params.push(assigned_staff_id);
    }

    if (req.user && req.user.role === 'STAFF') {
      query += ' AND c.assigned_staff_id = ?';
      params.push(req.user.id);
    } else if (req.user && req.user.role === 'CITIZEN') {
      query += ' AND c.citizen_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY c.id DESC LIMIT 100';
    const complaints = await db.all(query, params);

    const formatted = complaints.map(c => {
      let before = [];
      let after = [];
      try { before = c.before_images_json ? JSON.parse(c.before_images_json) : []; } catch (e) {}
      try { after = c.after_images_json ? JSON.parse(c.after_images_json) : []; } catch (e) {}
      return { ...c, before_images: before, after_images: after };
    });

    res.status(200).json({ success: true, count: formatted.length, complaints: formatted });
  } catch (err) {
    next(err);
  }
};

exports.getComplaintHistory = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : req.query.user_id;
    let query = `
      SELECT c.*, w.name as washroom_name, w.ward 
      FROM complaints c 
      LEFT JOIN washrooms w ON c.washroom_id = w.id 
      WHERE c.status IN ('Resolved', 'Closed', 'Rejected', 'Cancelled')
    `;
    const params = [];
    if (userId) {
      query += ' AND (c.citizen_id = ? OR c.assigned_staff_id = ?)';
      params.push(userId, userId);
    }
    query += ' ORDER BY c.updated_at DESC LIMIT 50';
    const history = await db.all(query, params);
    res.status(200).json({ success: true, count: history.length, history });
  } catch (err) {
    next(err);
  }
};

exports.getComplaintTimeline = async (req, res, next) => {
  try {
    const timeline = await db.all(
      `SELECT h.*, u.name as changed_by_name, u.role as changed_by_role 
       FROM complaint_status_history h 
       LEFT JOIN users u ON h.changed_by_user_id = u.id 
       WHERE h.complaint_id = ? ORDER BY h.timestamp ASC`,
      [req.params.id]
    );
    res.status(200).json({ success: true, count: timeline.length, timeline });
  } catch (err) {
    next(err);
  }
};

exports.getComplaintById = async (req, res, next) => {
  try {
    const c = await db.get(
      `SELECT c.*, w.name as washroom_name, w.address, w.ward, u.name as citizen_name, s.name as staff_name, sup.name as supervisor_name
       FROM complaints c
       LEFT JOIN washrooms w ON c.washroom_id = w.id
       LEFT JOIN users u ON c.citizen_id = u.id
       LEFT JOIN users s ON c.assigned_staff_id = s.id
       LEFT JOIN users sup ON c.supervisor_id = sup.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (!c) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    let before = [];
    let after = [];
    try { before = c.before_images_json ? JSON.parse(c.before_images_json) : []; } catch (e) {}
    try { after = c.after_images_json ? JSON.parse(c.after_images_json) : []; } catch (e) {}

    const media = await db.all('SELECT * FROM complaint_media WHERE complaint_id = ? ORDER BY created_at DESC', [c.id]);
    const assignments = await db.all('SELECT * FROM complaint_assignments WHERE complaint_id = ? ORDER BY assigned_at DESC', [c.id]);
    const timeline = await db.all('SELECT * FROM complaint_status_history WHERE complaint_id = ? ORDER BY timestamp ASC', [c.id]);

    res.status(200).json({
      success: true,
      complaint: { ...c, before_images: before, after_images: after, media, assignments, timeline }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateComplaint = async (req, res, next) => {
  try {
    const { category, priority, description, expected_resolution_time } = req.body;
    await db.run(
      `UPDATE complaints SET category = COALESCE(?, category), priority = COALESCE(?, priority), description = COALESCE(?, description), expected_resolution_time = COALESCE(?, expected_resolution_time), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [category || null, priority || null, description || null, expected_resolution_time || null, req.params.id]
    );
    const updated = await db.get('SELECT * FROM complaints WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Complaint updated.', complaint: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteComplaint = async (req, res, next) => {
  try {
    await db.run('DELETE FROM complaints WHERE id = ?', [req.params.id]);
    await db.run('DELETE FROM complaint_status_history WHERE complaint_id = ?', [req.params.id]);
    await db.run('DELETE FROM complaint_logs WHERE complaint_id = ?', [req.params.id]);
    await db.run('DELETE FROM complaint_media WHERE complaint_id = ?', [req.params.id]);
    await db.run('DELETE FROM complaint_assignments WHERE complaint_id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Complaint deleted completely.' });
  } catch (err) {
    next(err);
  }
};

exports.cancelComplaint = async (req, res, next) => {
  try {
    const c = await db.get('SELECT status FROM complaints WHERE id = ?', [req.params.id]);
    if (!c) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    if (['Resolved', 'Closed'].includes(c.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel an already resolved/closed complaint.' });
    }

    await db.run(`UPDATE complaints SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [req.params.id]);
    await db.run(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by_user_id, notes) VALUES (?, ?, 'Cancelled', ?, ?)`,
      [req.params.id, c.status, req.user ? req.user.id : null, req.body.reason || 'Cancelled by user']
    );
    await db.run(
      `INSERT INTO complaint_logs (complaint_id, previous_status, new_status, changed_by_user_id, notes) VALUES (?, ?, 'Cancelled', ?, ?)`,
      [req.params.id, c.status, req.user ? req.user.id : null, req.body.reason || 'Cancelled by user']
    );

    res.status(200).json({ success: true, message: 'Complaint cancelled successfully.' });
  } catch (err) {
    next(err);
  }
};

exports.updatePriority = async (req, res, next) => {
  try {
    const { priority } = req.body;
    if (!['Low', 'Medium', 'High', 'Urgent'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority value.' });
    }
    await db.run('UPDATE complaints SET priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [priority, req.params.id]);
    res.status(200).json({ success: true, message: `Priority updated to ${priority}.` });
  } catch (err) {
    next(err);
  }
};

exports.updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, notes, after_images = [], rejection_reason } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status required.' });

    const c = await db.get('SELECT * FROM complaints WHERE id = ?', [req.params.id]);
    if (!c) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    let afterUrls = [];
    if (Array.isArray(after_images)) afterUrls = [...after_images];
    else if (typeof after_images === 'string' && after_images.length > 0) {
      try { afterUrls = JSON.parse(after_images); } catch (e) { afterUrls = [after_images]; }
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadImage(file.path || file.buffer, file.originalname);
        if (url) afterUrls.push(url);
      }
    }

    // Save after photos into complaint_media
    for (const img of afterUrls) {
      await db.run(
        `INSERT INTO complaint_media (complaint_id, media_type, media_url, stage, uploaded_by_user_id) VALUES (?, 'PHOTO', ?, 'AFTER', ?)`,
        [c.id, img, req.user ? req.user.id : null]
      );
    }

    let existingAfter = [];
    try { existingAfter = c.after_images_json ? JSON.parse(c.after_images_json) : []; } catch (e) {}
    const finalAfter = [...existingAfter, ...afterUrls];

    const isResolved = ['Resolved', 'Closed'].includes(status);
    await db.run(
      `UPDATE complaints SET 
        status = ?, after_images_json = ?, rejection_reason = COALESCE(?, rejection_reason),
        resolved_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE resolved_at END,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, JSON.stringify(finalAfter), rejection_reason || null, isResolved ? 1 : 0, c.id]
    );

    const changedBy = req.user ? req.user.id : null;
    await db.run(
      `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by_user_id, notes) VALUES (?, ?, ?, ?, ?)`,
      [c.id, c.status, status, changedBy, notes || `Status updated to ${status}`]
    );
    await db.run(
      `INSERT INTO complaint_logs (complaint_id, previous_status, new_status, changed_by_user_id, notes) VALUES (?, ?, ?, ?, ?)`,
      [c.id, c.status, status, changedBy, notes || `Status updated to ${status}`]
    );

    const updated = await db.get('SELECT * FROM complaints WHERE id = ?', [c.id]);
    res.status(200).json({ success: true, message: `Status updated to ${status}`, complaint: updated });
  } catch (err) {
    next(err);
  }
};

exports.assignStaff = async (req, res, next) => {
  try {
    const { assigned_staff_id, supervisor_id, notes } = req.body;
    if (!assigned_staff_id) {
      return res.status(400).json({ success: false, message: 'assigned_staff_id required.' });
    }

    const c = await db.get('SELECT * FROM complaints WHERE id = ?', [req.params.id]);
    if (!c) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    await db.run(
      `UPDATE complaints SET assigned_staff_id = ?, supervisor_id = COALESCE(?, supervisor_id), status = CASE WHEN status = 'New Complaint' THEN 'Assigned' ELSE status END, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [assigned_staff_id, supervisor_id || null, c.id]
    );

    await db.run(
      `INSERT INTO complaint_assignments (complaint_id, assigned_staff_id, assigned_by_user_id, notes) VALUES (?, ?, ?, ?)`,
      [c.id, assigned_staff_id, req.user ? req.user.id : null, notes || 'Assigned to staff']
    );

    if (c.status === 'New Complaint') {
      await db.run(
        `INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by_user_id, notes) VALUES (?, ?, 'Assigned', ?, ?)`,
        [c.id, c.status, req.user ? req.user.id : null, notes || `Assigned to staff #${assigned_staff_id}`]
      );
      await db.run(
        `INSERT INTO complaint_logs (complaint_id, previous_status, new_status, changed_by_user_id, notes) VALUES (?, ?, 'Assigned', ?, ?)`,
        [c.id, c.status, req.user ? req.user.id : null, notes || `Assigned to staff #${assigned_staff_id}`]
      );
    }

    res.status(200).json({ success: true, message: 'Staff assigned successfully.' });
  } catch (err) {
    next(err);
  }
};
