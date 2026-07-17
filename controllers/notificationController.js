const db = require('../config/db');

exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : req.query.user_id;
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];
    if (userId && (!req.user || req.user.role !== 'SUPER_ADMIN')) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    query += ' ORDER BY created_at DESC LIMIT 50';
    const notifications = await db.all(query, params);
    const unreadCount = notifications.filter(n => n.is_read === 0 || n.is_read === false).length;
    res.status(200).json({ success: true, count: notifications.length, unread_count: unreadCount, notifications });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    await db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    await db.run('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (err) {
    next(err);
  }
};

exports.sendNotification = async (req, res, next) => {
  try {
    const { user_id, title, message, type = 'INFO' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message required.' });
    }

    if (user_id === 'ALL' || !user_id) {
      const users = await db.all('SELECT id FROM users WHERE status = "Active"');
      for (const u of users) {
        await db.run('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)', [u.id, title, message, type]);
      }
      return res.status(201).json({ success: true, message: `Notification broadcasted to ${users.length} active users.` });
    } else {
      const resIns = await db.run('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)', [user_id, title, message, type]);
      return res.status(201).json({ success: true, message: 'Notification sent.', notification: { id: resIns.lastInsertRowid, user_id, title, message, type } });
    }
  } catch (err) {
    next(err);
  }
};
