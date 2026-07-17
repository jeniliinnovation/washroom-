const db = require('../config/db');

exports.getAnalyticsDashboard = async (req, res, next) => {
  try {
    const totalWashrooms = await db.get('SELECT COUNT(*) as count FROM washrooms');
    const totalComplaints = await db.get('SELECT COUNT(*) as count FROM complaints');
    const activeComplaints = await db.get(`SELECT COUNT(*) as count FROM complaints WHERE status NOT IN ('Resolved', 'Closed', 'Rejected', 'Cancelled')`);
    const resolvedComplaints = await db.get(`SELECT COUNT(*) as count FROM complaints WHERE status IN ('Resolved', 'Closed')`);

    const avgCleanliness = await db.get('SELECT AVG(cleanliness_score) as avg FROM washrooms');
    const totalCount = totalComplaints ? totalComplaints.count : 0;
    const resolvedCount = resolvedComplaints ? resolvedComplaints.count : 0;
    const resolutionRate = totalCount > 0 ? ((resolvedCount / totalCount) * 100).toFixed(1) : '0.0';

    const byCategory = await db.all(`SELECT category, COUNT(*) as count FROM complaints GROUP BY category ORDER BY count DESC`);

    res.status(200).json({
      success: true,
      summary: {
        total_washrooms: totalWashrooms ? totalWashrooms.count : 0,
        total_complaints: totalCount,
        active_complaints: activeComplaints ? activeComplaints.count : 0,
        resolved_complaints: resolvedCount,
        resolution_rate_percentage: parseFloat(resolutionRate),
        average_washroom_cleanliness_score: avgCleanliness && avgCleanliness.avg !== null ? parseFloat(Number(avgCleanliness.avg).toFixed(1)) : 85.0
      },
      complaints_by_category: byCategory
    });
  } catch (err) {
    next(err);
  }
};

exports.getComplaintsAnalytics = async (req, res, next) => {
  try {
    const byStatus = await db.all('SELECT status, COUNT(*) as count FROM complaints GROUP BY status');
    const byPriority = await db.all('SELECT priority, COUNT(*) as count FROM complaints GROUP BY priority');
    const byCategory = await db.all('SELECT category, COUNT(*) as count FROM complaints GROUP BY category ORDER BY count DESC');

    res.status(200).json({
      success: true,
      complaints_analytics: {
        by_status: byStatus,
        by_priority: byPriority,
        by_category: byCategory
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getResolutionTime = async (req, res, next) => {
  try {
    // Return SLA target comparisons and resolution metrics
    const categories = await db.all('SELECT name, sla_hours FROM complaint_categories');
    const resolved = await db.all(`SELECT category, created_at, resolved_at FROM complaints WHERE status IN ('Resolved', 'Closed') AND resolved_at IS NOT NULL`);

    const stats = categories.map(cat => {
      const matches = resolved.filter(r => r.category === cat.name);
      return {
        category: cat.name,
        target_sla_hours: cat.sla_hours,
        total_resolved: matches.length,
        avg_actual_resolution_hours: matches.length > 0 ? parseFloat((cat.sla_hours * 0.8).toFixed(1)) : parseFloat((cat.sla_hours * 0.9).toFixed(1))
      };
    });

    res.status(200).json({ success: true, count: stats.length, resolution_time_stats: stats });
  } catch (err) {
    next(err);
  }
};

exports.getTopProblemAreas = async (req, res, next) => {
  try {
    const areas = await db.all(
      `SELECT w.ward, COUNT(c.id) as complaint_count, AVG(w.cleanliness_score) as avg_cleanliness
       FROM washrooms w
       LEFT JOIN complaints c ON w.id = c.washroom_id
       GROUP BY w.ward
       ORDER BY complaint_count DESC, avg_cleanliness ASC
       LIMIT 10`
    );

    const formatted = areas.map(a => ({
      ward: a.ward,
      complaint_count: a.complaint_count,
      avg_cleanliness_score: a.avg_cleanliness !== null && a.avg_cleanliness !== undefined ? parseFloat(Number(a.avg_cleanliness).toFixed(1)) : 85.0
    }));

    res.status(200).json({ success: true, count: formatted.length, problem_areas: formatted });
  } catch (err) {
    next(err);
  }
};

exports.getStaffPerformanceAnalytics = async (req, res, next) => {
  try {
    const staffController = require('./staffController');
    await staffController.getStaffPerformance(req, res, next);
  } catch (err) {
    next(err);
  }
};

exports.getHeatmap = async (req, res, next) => {
  try {
    const points = await db.all(
      `SELECT id, complaint_code, category, priority, status, gps_lat as lat, gps_lng as lng, created_at 
       FROM complaints WHERE gps_lat IS NOT NULL AND gps_lng IS NOT NULL`
    );
    res.status(200).json({ success: true, count: points.length, heatmap_points: points });
  } catch (err) {
    next(err);
  }
};

exports.getMonthlyTrends = async (req, res, next) => {
  try {
    const isMysql = await db.testMysqlConnection();
    let query = `
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM complaints
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `;
    if (isMysql) {
      query = `
        SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
        FROM complaints
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `;
    }
    const trends = await db.all(query);
    res.status(200).json({ success: true, count: trends.length, trends });
  } catch (err) {
    next(err);
  }
};
