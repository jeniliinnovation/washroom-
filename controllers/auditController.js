const db = require('../config/db');

async function ensureTables() {
  const isMysql = await db.testMysqlConnection();
  if (isMysql) {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        email VARCHAR(255),
        ip_address VARCHAR(100),
        success INT DEFAULT 1,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS error_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        error_message TEXT,
        stack_trace TEXT,
        endpoint VARCHAR(255),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } else {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        email VARCHAR(255),
        ip_address VARCHAR(100),
        success INTEGER DEFAULT 1,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS error_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        error_message TEXT,
        stack_trace TEXT,
        endpoint VARCHAR(255),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
}

exports.getLogs = async (req, res, next) => {
  try {
    const logs = await db.all('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (err) { next(err); }
};

exports.getLoginLogs = async (req, res, next) => {
  try {
    await ensureTables();
    const logs = await db.all('SELECT * FROM login_attempts ORDER BY timestamp DESC LIMIT 100');
    res.status(200).json({ success: true, count: logs.length, login_logs: logs });
  } catch (err) { next(err); }
};

exports.getActivityLogs = async (req, res, next) => {
  try {
    await ensureTables();
    const logs = await db.all(
      `SELECT a.*, u.name as user_name, u.role as user_role 
       FROM activity_logs a 
       LEFT JOIN users u ON a.user_id = u.id 
       ORDER BY a.timestamp DESC LIMIT 100`
    );
    res.status(200).json({ success: true, count: logs.length, activity_logs: logs });
  } catch (err) { next(err); }
};

exports.getErrorLogs = async (req, res, next) => {
  try {
    await ensureTables();
    const logs = await db.all('SELECT * FROM error_logs ORDER BY timestamp DESC LIMIT 100');
    res.status(200).json({ success: true, count: logs.length, error_logs: logs });
  } catch (err) { next(err); }
};
