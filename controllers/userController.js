const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res, next) => {
  try {
    const { role, status, ward } = req.query;
    let query = 'SELECT id, name, email, phone, role, ward_name, assigned_area, civic_points, status, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (ward) {
      query += ' AND ward_name = ?';
      params.push(ward);
    }

    query += ' ORDER BY id DESC LIMIT 100';
    const users = await db.all(query, params);
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(200).json({ success: true, users: [] });
    const users = await db.all(
      `SELECT id, name, email, phone, role, ward_name, status FROM users 
       WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? ORDER BY name ASC LIMIT 30`,
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await db.get(
      'SELECT id, name, email, phone, role, ward_name, assigned_area, civic_points, status, profile_image_url, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, phone, ward_name, assigned_area } = req.body;
    await db.run(
      `UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), ward_name = COALESCE(?, ward_name), assigned_area = COALESCE(?, assigned_area), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name || null, phone || null, ward_name || null, assigned_area || null, req.params.id]
    );
    const updated = await db.get('SELECT id, name, email, phone, role, ward_name, assigned_area FROM users WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'User updated successfully.', user: updated });
  } catch (err) {
    next(err);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Suspended', 'Deactivated'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }
    await db.run('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
    res.status(200).json({ success: true, message: `User status updated to ${status}.` });
  } catch (err) {
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['CITIZEN', 'STAFF', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role value.' });
    }
    await db.run('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [role, req.params.id]);
    res.status(200).json({ success: true, message: `User role updated to ${role}.` });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'User permanently deleted.' });
  } catch (err) {
    next(err);
  }
};
