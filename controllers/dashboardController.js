const db = require('../config/db');

exports.getAdminDashboard = async (req, res, next) => {
  try {
    const totalWashrooms = await db.get('SELECT COUNT(*) as cnt FROM washrooms');
    const totalComplaints = await db.get('SELECT COUNT(*) as cnt FROM complaints');
    const activeComplaints = await db.get(`SELECT COUNT(*) as cnt FROM complaints WHERE status NOT IN ('Resolved', 'Closed', 'Rejected', 'Cancelled')`);
    const resolvedComplaints = await db.get(`SELECT COUNT(*) as cnt FROM complaints WHERE status IN ('Resolved', 'Closed')`);
    const staffCount = await db.get(`SELECT COUNT(*) as cnt FROM users WHERE role = 'STAFF'`);
    const avgScore = await db.get('SELECT AVG(cleanliness_score) as avg FROM washrooms');

    const recentComplaints = await db.all(
      `SELECT c.*, w.name as washroom_name, w.ward FROM complaints c LEFT JOIN washrooms w ON c.washroom_id = w.id ORDER BY c.created_at DESC LIMIT 10`
    );

    res.status(200).json({
      success: true,
      role: 'ADMIN',
      kpis: {
        total_washrooms: totalWashrooms.cnt,
        total_complaints: totalComplaints.cnt,
        active_complaints: activeComplaints.cnt,
        resolved_complaints: resolvedComplaints.cnt,
        staff_count: staffCount.cnt,
        avg_cleanliness_score: avgScore && avgScore.avg !== null ? parseFloat(Number(avgScore.avg).toFixed(1)) : 85.0
      },
      recent_complaints: recentComplaints
    });
  } catch (err) {
    next(err);
  }
};

exports.getStaffDashboard = async (req, res, next) => {
  try {
    const staffId = req.user ? req.user.id : (req.query.staff_id || null);
    let assignedCount = { cnt: 0 };
    let completedCount = { cnt: 0 };
    let tasks = [];

    if (staffId) {
      assignedCount = await db.get(`SELECT COUNT(*) as cnt FROM complaints WHERE assigned_staff_id = ? AND status NOT IN ('Resolved', 'Closed', 'Rejected', 'Cancelled')`, [staffId]) || { cnt: 0 };
      completedCount = await db.get(`SELECT COUNT(*) as cnt FROM complaints WHERE assigned_staff_id = ? AND status IN ('Resolved', 'Closed')`, [staffId]) || { cnt: 0 };
      tasks = await db.all(`SELECT * FROM cleaning_tasks WHERE staff_id = ? ORDER BY id DESC LIMIT 10`, [staffId]);
    }

    res.status(200).json({
      success: true,
      role: 'STAFF',
      staff_id: staffId,
      kpis: {
        active_assigned_jobs: assignedCount.cnt,
        completed_jobs: completedCount.cnt
      },
      assigned_tasks: tasks
    });
  } catch (err) {
    next(err);
  }
};

exports.getSupervisorDashboard = async (req, res, next) => {
  try {
    const supController = require('./supervisorController');
    await supController.getDashboard(req, res, next);
  } catch (err) {
    next(err);
  }
};

exports.getCitizenDashboard = async (req, res, next) => {
  try {
    const citizenId = req.user ? req.user.id : (req.query.citizen_id || null);
    let myComplaints = [];
    let points = 50;

    if (citizenId) {
      myComplaints = await db.all(`SELECT c.*, w.name as washroom_name FROM complaints c LEFT JOIN washrooms w ON c.washroom_id = w.id WHERE c.citizen_id = ? ORDER BY c.created_at DESC LIMIT 15`, [citizenId]);
      const u = await db.get('SELECT civic_points FROM users WHERE id = ?', [citizenId]);
      if (u) points = u.civic_points;
    }

    const nearbyWashrooms = await db.all(`SELECT * FROM washrooms WHERE status = 'Active' ORDER BY avg_rating DESC LIMIT 5`);

    res.status(200).json({
      success: true,
      role: 'CITIZEN',
      citizen_id: citizenId,
      civic_points: points,
      my_complaints: myComplaints,
      recommended_washrooms: nearbyWashrooms
    });
  } catch (err) {
    next(err);
  }
};
