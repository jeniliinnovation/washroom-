const db = require('../config/db');

exports.getCategories = async (req, res, next) => {
  try {
    const data = await db.all('SELECT * FROM complaint_categories ORDER BY id ASC');
    res.status(200).json({ success: true, count: data.length, categories: data });
  } catch (err) { next(err); }
};

exports.getStatusList = async (req, res, next) => {
  try {
    const statuses = [
      'New Complaint', 'Under Review', 'Assigned', 'In Progress',
      'Cleaning Completed', 'Verification Pending', 'Resolved',
      'Citizen Feedback', 'Closed', 'Rejected', 'Cancelled'
    ];
    res.status(200).json({ success: true, count: statuses.length, status_list: statuses });
  } catch (err) { next(err); }
};

exports.getCities = async (req, res, next) => {
  try {
    const data = await db.all('SELECT * FROM cities ORDER BY name ASC');
    res.status(200).json({ success: true, count: data.length, cities: data });
  } catch (err) { next(err); }
};

exports.getStates = async (req, res, next) => {
  try {
    const data = await db.all('SELECT * FROM states ORDER BY name ASC');
    res.status(200).json({ success: true, count: data.length, states: data });
  } catch (err) { next(err); }
};

exports.getAreas = async (req, res, next) => {
  try {
    const data = await db.all('SELECT * FROM areas ORDER BY name ASC');
    res.status(200).json({ success: true, count: data.length, areas: data });
  } catch (err) { next(err); }
};

exports.getWards = async (req, res, next) => {
  try {
    const data = await db.all('SELECT * FROM wards ORDER BY name ASC');
    res.status(200).json({ success: true, count: data.length, wards: data });
  } catch (err) { next(err); }
};

exports.getFacilities = async (req, res, next) => {
  try {
    const data = await db.all('SELECT * FROM facilities ORDER BY id ASC');
    res.status(200).json({ success: true, count: data.length, facilities: data });
  } catch (err) { next(err); }
};

exports.getRoles = async (req, res, next) => {
  try {
    const data = await db.all('SELECT * FROM roles ORDER BY id ASC');
    res.status(200).json({ success: true, count: data.length, roles: data });
  } catch (err) { next(err); }
};

exports.getPermissions = async (req, res, next) => {
  try {
    const data = await db.all('SELECT * FROM permissions ORDER BY id ASC');
    res.status(200).json({ success: true, count: data.length, permissions: data });
  } catch (err) { next(err); }
};

exports.getPriorityList = async (req, res, next) => {
  try {
    const data = await db.all('SELECT * FROM priorities ORDER BY level ASC');
    res.status(200).json({ success: true, count: data.length, priorities: data });
  } catch (err) { next(err); }
};

exports.getNotificationTemplates = async (req, res, next) => {
  try {
    const data = await db.all('SELECT * FROM notification_templates ORDER BY id ASC');
    res.status(200).json({ success: true, count: data.length, notification_templates: data });
  } catch (err) { next(err); }
};
