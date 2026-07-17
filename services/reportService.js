const db = require('../config/db');

class ReportService {
  async getDailyReport(dateStr) {
    const targetDate = dateStr || new Date().toISOString().slice(0, 10);
    const complaints = await db.all(
      `SELECT c.*, w.name as washroom_name, w.ward 
       FROM complaints c 
       LEFT JOIN washrooms w ON c.washroom_id = w.id 
       WHERE c.created_at LIKE ? ORDER BY c.created_at DESC`,
      [`${targetDate}%`]
    );

    const activeCount = complaints.filter(c => !['Resolved', 'Closed', 'Rejected'].includes(c.status)).length;
    const resolvedCount = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;

    return {
      report_type: 'DAILY_MUNICIPAL_SUMMARY',
      date: targetDate,
      total_complaints_received: complaints.length,
      active_complaints: activeCount,
      resolved_complaints: resolvedCount,
      complaints
    };
  }

  async getSummaryReport(period) { // 'weekly', 'monthly', 'yearly'
    let dateCondition = "created_at >= DATETIME('now', '-7 day')";
    if (period === 'monthly') dateCondition = "created_at >= DATETIME('now', '-30 day')";
    if (period === 'yearly') dateCondition = "created_at >= DATETIME('now', '-365 day')";

    // Note: db.js formatQueryForEngine translates DATETIME expressions to MySQL syntax automatically
    const complaints = await db.all(`SELECT * FROM complaints WHERE ${dateCondition}`);
    const total = complaints.length;
    const resolved = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;

    const byCategory = await db.all(`SELECT category, COUNT(*) as count FROM complaints WHERE ${dateCondition} GROUP BY category ORDER BY count DESC`);
    const byPriority = await db.all(`SELECT priority, COUNT(*) as count FROM complaints WHERE ${dateCondition} GROUP BY priority`);

    return {
      report_type: `${period.toUpperCase()}_MUNICIPAL_REPORT`,
      total_complaints: total,
      resolved_count: resolved,
      resolution_rate_percentage: total > 0 ? parseFloat(((resolved / total) * 100).toFixed(1)) : 100.0,
      breakdown_by_category: byCategory,
      breakdown_by_priority: byPriority
    };
  }

  async generateCsvExport() {
    const complaints = await db.all(
      `SELECT c.complaint_code, c.category, c.priority, c.status, w.name as washroom_name, w.ward,
              u.name as citizen_name, s.name as staff_name, c.created_at, c.resolved_at
       FROM complaints c
       LEFT JOIN washrooms w ON c.washroom_id = w.id
       LEFT JOIN users u ON c.citizen_id = u.id
       LEFT JOIN users s ON c.assigned_staff_id = s.id
       ORDER BY c.created_at DESC`
    );

    let csv = 'Complaint Code,Category,Priority,Status,Washroom Name,Ward,Citizen Name,Assigned Staff,Created At,Resolved At\n';
    for (const c of complaints) {
      csv += `"${c.complaint_code}","${c.category}","${c.priority}","${c.status}","${c.washroom_name || ''}","${c.ward || ''}","${c.citizen_name || 'Guest'}","${c.staff_name || 'Unassigned'}","${c.created_at}","${c.resolved_at || ''}"\n`;
    }
    return csv;
  }

  async generatePdfSummary() {
    // Generate structured HTML/Text summary for PDF export representation
    const stats = await this.getSummaryReport('monthly');
    return {
      document_title: 'Clean Toilet Portal - Municipal Executive PDF Summary',
      generated_at: new Date().toISOString(),
      summary_metrics: stats,
      status: 'Ready for print or PDF rendering'
    };
  }
}

module.exports = new ReportService();
