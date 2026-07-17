require('dotenv').config();
const mysql = require('mysql2/promise');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let mysqlPool = null;
let useMysql = false;
let sqliteDb = null;
let SQL = null;
const SQLITE_DB_PATH = path.join(__dirname, '../database/database.sqlite');
let connectionCheckPromise = null;

async function testMysqlConnection() {
  if (mysqlPool !== null) return useMysql;
  if (connectionCheckPromise !== null) return connectionCheckPromise;

  connectionCheckPromise = (async () => {
    try {
      const tempConnection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
      });
      
      const dbName = process.env.DB_NAME || 'washroom';
      await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await tempConnection.end();

      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      const [rows] = await mysqlPool.query('SELECT 1 as val');
      useMysql = true;
      console.log(`🐬 Connected to MySQL Database: '${dbName}' on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
      return true;
    } catch (err) {
      console.warn(`⚠️ MySQL connection failed (${err.message}). Automatically falling back to embedded SQLite (database.sqlite).`);
      useMysql = false;
      mysqlPool = null;
      return false;
    }
  })();

  return connectionCheckPromise;
}

async function getSqliteDB() {
  if (sqliteDb) return sqliteDb;
  SQL = await initSqlJs();
  const dbDir = path.dirname(SQLITE_DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (fs.existsSync(SQLITE_DB_PATH)) {
    const fileBuffer = fs.readFileSync(SQLITE_DB_PATH);
    sqliteDb = new SQL.Database(fileBuffer);
  } else {
    sqliteDb = new SQL.Database();
  }
  return sqliteDb;
}

async function saveSqliteToDisk() {
  if (!sqliteDb || useMysql) return;
  const data = sqliteDb.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(SQLITE_DB_PATH, buffer);
}

// Convert SQLite queries or parameters if running against MySQL
function formatQueryForEngine(sql, isMysql) {
  if (isMysql) {
    // Convert SQLite AUTOINCREMENT to MySQL AUTO_INCREMENT in CREATE TABLE statements
    sql = sql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'INT AUTO_INCREMENT PRIMARY KEY');
    // Convert SQLite date expressions to MySQL expressions
    sql = sql.replace(/DATETIME\('now',\s*'-(\d+)\s*day'\)/gi, 'NOW() - INTERVAL $1 DAY');
    sql = sql.replace(/DATETIME\('now',\s*'\+(\d+)\s*hour'\)/gi, 'NOW() + INTERVAL $1 HOUR');
    sql = sql.replace(/DATETIME\('now',\s*'-(\d+)\s*hour'\)/gi, 'NOW() - INTERVAL $1 HOUR');
    sql = sql.replace(/DATETIME\('now'\)/gi, 'NOW()');
    sql = sql.replace(/strftime\('%Y-%m',\s*([a-zA-Z0-9_.]+)\)/gi, "DATE_FORMAT($1, '%Y-%m')");
    sql = sql.replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/gi, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  } else {
    // Convert MySQL FOREIGN_KEY_CHECKS to SQLite PRAGMA
    sql = sql.replace(/SET FOREIGN_KEY_CHECKS = 0;/gi, 'PRAGMA foreign_keys = OFF;');
    sql = sql.replace(/SET FOREIGN_KEY_CHECKS = 1;/gi, 'PRAGMA foreign_keys = ON;');
  }
  return sql;
}

async function exec(sql) {
  const isMysql = await testMysqlConnection();
  const formattedSql = formatQueryForEngine(sql, isMysql);

  if (isMysql) {
    const statements = formattedSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of statements) {
      await mysqlPool.query(stmt);
    }
  } else {
    const db = await getSqliteDB();
    db.run(formattedSql);
    await saveSqliteToDisk();
  }
}

async function run(sql, params = []) {
  const isMysql = await testMysqlConnection();
  const formattedSql = formatQueryForEngine(sql, isMysql);

  if (isMysql) {
    const [result] = await mysqlPool.execute(formattedSql, params);
    return {
      lastInsertRowid: result.insertId || null,
      changes: result.affectedRows || 0
    };
  } else {
    const db = await getSqliteDB();
    const stmt = db.prepare(formattedSql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    await saveSqliteToDisk();

    const idResult = db.exec("SELECT last_insert_rowid() AS id")[0];
    const lastInsertRowid = idResult && idResult.values && idResult.values[0] ? idResult.values[0][0] : null;
    const changes = db.getRowsModified();
    return { lastInsertRowid, changes };
  }
}

async function get(sql, params = []) {
  const isMysql = await testMysqlConnection();
  const formattedSql = formatQueryForEngine(sql, isMysql);

  if (isMysql) {
    const [rows] = await mysqlPool.execute(formattedSql, params);
    return rows.length > 0 ? rows[0] : null;
  } else {
    const db = await getSqliteDB();
    const stmt = db.prepare(formattedSql);
    stmt.bind(params);
    let row = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    return row;
  }
}

async function all(sql, params = []) {
  const isMysql = await testMysqlConnection();
  const formattedSql = formatQueryForEngine(sql, isMysql);

  if (isMysql) {
    const [rows] = await mysqlPool.execute(formattedSql, params);
    return rows;
  } else {
    const db = await getSqliteDB();
    const stmt = db.prepare(formattedSql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }
}

module.exports = {
  testMysqlConnection,
  exec,
  run,
  get,
  all,
  getPool: () => mysqlPool
};
