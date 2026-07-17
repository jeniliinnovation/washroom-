const db = require('../config/db');

exports.getSettings = async (req, res, next) => {
  try {
    const rows = await db.all('SELECT setting_key, setting_value, category, description, updated_at FROM settings ORDER BY setting_key ASC');
    const grouped = { general: {}, email: {}, sms: {}, push: {}, storage: {} };
    for (const r of rows) {
      const cat = r.category && grouped[r.category.toLowerCase()] !== undefined ? r.category.toLowerCase() : 'general';
      grouped[cat][r.setting_key] = r.setting_value;
    }
    res.status(200).json({ success: true, count: rows.length, settings: grouped });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const settingsObj = req.body.settings || req.body;
    const entries = Object.entries(settingsObj);
    for (const [k, v] of entries) {
      if (typeof v !== 'object') {
        const exist = await db.get('SELECT setting_key FROM settings WHERE setting_key = ?', [k]);
        if (exist) {
          await db.run('UPDATE settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?', [String(v), k]);
        } else {
          await db.run('INSERT INTO settings (setting_key, setting_value, description, category) VALUES (?, ?, ?, ?)', [k, String(v), `Updated via API`, 'GENERAL']);
        }
      }
    }
    res.status(200).json({ success: true, message: 'Settings updated successfully.' });
  } catch (err) { next(err); }
};

exports.getEmailSettings = async (req, res, next) => {
  try {
    const rows = await db.all('SELECT setting_key, setting_value FROM settings WHERE category = "EMAIL" OR category = "email"');
    const emailObj = {};
    for (const r of rows) emailObj[r.setting_key] = r.setting_value;
    res.status(200).json({ success: true, email_settings: emailObj });
  } catch (err) { next(err); }
};

exports.updateEmailSettings = async (req, res, next) => {
  try {
    const entries = Object.entries(req.body);
    for (const [k, v] of entries) {
      const exist = await db.get('SELECT setting_key FROM settings WHERE setting_key = ?', [k]);
      if (exist) {
        await db.run('UPDATE settings SET setting_value = ?, category = "EMAIL", updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?', [String(v), k]);
      } else {
        await db.run('INSERT INTO settings (setting_key, setting_value, description, category) VALUES (?, ?, ?, "EMAIL")', [k, String(v), 'Email setting', 'EMAIL']);
      }
    }
    res.status(200).json({ success: true, message: 'Email settings updated.' });
  } catch (err) { next(err); }
};

exports.getSmsSettings = async (req, res, next) => {
  try {
    const rows = await db.all('SELECT setting_key, setting_value FROM settings WHERE category = "SMS" OR category = "sms"');
    const smsObj = {};
    for (const r of rows) smsObj[r.setting_key] = r.setting_value;
    res.status(200).json({ success: true, sms_settings: smsObj });
  } catch (err) { next(err); }
};

exports.updateSmsSettings = async (req, res, next) => {
  try {
    const entries = Object.entries(req.body);
    for (const [k, v] of entries) {
      const exist = await db.get('SELECT setting_key FROM settings WHERE setting_key = ?', [k]);
      if (exist) {
        await db.run('UPDATE settings SET setting_value = ?, category = "SMS", updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?', [String(v), k]);
      } else {
        await db.run('INSERT INTO settings (setting_key, setting_value, description, category) VALUES (?, ?, ?, "SMS")', [k, String(v), 'SMS setting', 'SMS']);
      }
    }
    res.status(200).json({ success: true, message: 'SMS settings updated.' });
  } catch (err) { next(err); }
};

exports.getPushSettings = async (req, res, next) => {
  try {
    const rows = await db.all('SELECT setting_key, setting_value FROM settings WHERE category = "PUSH" OR category = "push"');
    const pushObj = {};
    for (const r of rows) pushObj[r.setting_key] = r.setting_value;
    res.status(200).json({ success: true, push_settings: pushObj });
  } catch (err) { next(err); }
};

exports.updatePushSettings = async (req, res, next) => {
  try {
    const entries = Object.entries(req.body);
    for (const [k, v] of entries) {
      const exist = await db.get('SELECT setting_key FROM settings WHERE setting_key = ?', [k]);
      if (exist) {
        await db.run('UPDATE settings SET setting_value = ?, category = "PUSH", updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?', [String(v), k]);
      } else {
        await db.run('INSERT INTO settings (setting_key, setting_value, description, category) VALUES (?, ?, ?, "PUSH")', [k, String(v), 'Push setting', 'PUSH']);
      }
    }
    res.status(200).json({ success: true, message: 'Push notification settings updated.' });
  } catch (err) { next(err); }
};

exports.getStorageSettings = async (req, res, next) => {
  try {
    const rows = await db.all('SELECT setting_key, setting_value FROM settings WHERE category = "STORAGE" OR category = "storage"');
    const storageObj = {};
    for (const r of rows) storageObj[r.setting_key] = r.setting_value;
    res.status(200).json({ success: true, storage_settings: storageObj });
  } catch (err) { next(err); }
};

exports.updateStorageSettings = async (req, res, next) => {
  try {
    const entries = Object.entries(req.body);
    for (const [k, v] of entries) {
      const exist = await db.get('SELECT setting_key FROM settings WHERE setting_key = ?', [k]);
      if (exist) {
        await db.run('UPDATE settings SET setting_value = ?, category = "STORAGE", updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?', [String(v), k]);
      } else {
        await db.run('INSERT INTO settings (setting_key, setting_value, description, category) VALUES (?, ?, ?, "STORAGE")', [k, String(v), 'Storage setting', 'STORAGE']);
      }
    }
    res.status(200).json({ success: true, message: 'Storage settings updated.' });
  } catch (err) { next(err); }
};
