const db = require('../config/db');
const { uploadImage } = require('../config/cloudinary');

exports.getAllTasks = async (req, res, next) => {
  try {
    const { staff_id, supervisor_id, status, washroom_id } = req.query;
    let query = `
      SELECT t.*, w.name as washroom_name, w.ward, s.name as staff_name, sup.name as supervisor_name
      FROM cleaning_tasks t
      LEFT JOIN washrooms w ON t.washroom_id = w.id
      LEFT JOIN users s ON t.staff_id = s.id
      LEFT JOIN users sup ON t.supervisor_id = sup.id
      WHERE 1=1
    `;
    const params = [];

    if (staff_id) { query += ' AND t.staff_id = ?'; params.push(staff_id); }
    if (supervisor_id) { query += ' AND t.supervisor_id = ?'; params.push(supervisor_id); }
    if (status) { query += ' AND t.status = ?'; params.push(status); }
    if (washroom_id) { query += ' AND t.washroom_id = ?'; params.push(washroom_id); }

    if (req.user && req.user.role === 'STAFF') {
      query += ' AND t.staff_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY t.id DESC LIMIT 100';
    const tasks = await db.all(query, params);
    res.status(200).json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    next(err);
  }
};

exports.getTaskById = async (req, res, next) => {
  try {
    const task = await db.get(
      `SELECT t.*, w.name as washroom_name, w.address, s.name as staff_name, sup.name as supervisor_name
       FROM cleaning_tasks t
       LEFT JOIN washrooms w ON t.washroom_id = w.id
       LEFT JOIN users s ON t.staff_id = s.id
       LEFT JOIN users sup ON t.supervisor_id = sup.id
       WHERE t.id = ?`,
      [req.params.id]
    );
    if (!task) return res.status(404).json({ success: false, message: 'Cleaning task not found.' });
    res.status(200).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const { washroom_id, staff_id, supervisor_id, task_type = 'Scheduled Cleaning', scheduled_start, notes } = req.body;
    if (!washroom_id || !staff_id) {
      return res.status(400).json({ success: false, message: 'washroom_id and staff_id are required.' });
    }

    const taskCode = `TASK-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const result = await db.run(
      `INSERT INTO cleaning_tasks (task_code, washroom_id, staff_id, supervisor_id, task_type, status, scheduled_start, notes)
       VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)`,
      [taskCode, washroom_id, staff_id, supervisor_id || (req.user ? req.user.id : null), task_type, scheduled_start || new Date().toISOString(), notes || null]
    );

    res.status(201).json({
      success: true,
      message: 'Cleaning task created successfully.',
      task: { id: result.lastInsertRowid, task_code: taskCode, washroom_id, staff_id, status: 'Pending' }
    });
  } catch (err) {
    next(err);
  }
};

exports.startTask = async (req, res, next) => {
  try {
    await db.run(`UPDATE cleaning_tasks SET status = 'In Progress', started_at = CURRENT_TIMESTAMP WHERE id = ?`, [req.params.id]);
    res.status(200).json({ success: true, message: 'Task started (`In Progress`).' });
  } catch (err) {
    next(err);
  }
};

exports.pauseTask = async (req, res, next) => {
  try {
    await db.run(`UPDATE cleaning_tasks SET status = 'Paused' WHERE id = ?`, [req.params.id]);
    res.status(200).json({ success: true, message: 'Task paused.' });
  } catch (err) {
    next(err);
  }
};

exports.resumeTask = async (req, res, next) => {
  try {
    await db.run(`UPDATE cleaning_tasks SET status = 'In Progress' WHERE id = ?`, [req.params.id]);
    res.status(200).json({ success: true, message: 'Task resumed (`In Progress`).' });
  } catch (err) {
    next(err);
  }
};

exports.completeTask = async (req, res, next) => {
  try {
    const task = await db.get('SELECT staff_id FROM cleaning_tasks WHERE id = ?', [req.params.id]);
    await db.run(`UPDATE cleaning_tasks SET status = 'Completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?`, [req.params.id]);

    if (task && task.staff_id) {
      const today = new Date().toISOString().slice(0, 10);
      const att = await db.get('SELECT id FROM staff_attendance WHERE staff_id = ? AND date = ?', [task.staff_id, today]);
      if (att) {
        await db.run('UPDATE staff_attendance SET tasks_completed = tasks_completed + 1 WHERE id = ?', [att.id]);
      } else {
        await db.run('INSERT INTO staff_attendance (staff_id, date, status, tasks_completed) VALUES (?, ?, "Present", 1)', [task.staff_id, today]);
      }
    }

    res.status(200).json({ success: true, message: 'Task completed (`Completed`).' });
  } catch (err) {
    next(err);
  }
};

exports.cancelTask = async (req, res, next) => {
  try {
    await db.run(`UPDATE cleaning_tasks SET status = 'Cancelled' WHERE id = ?`, [req.params.id]);
    res.status(200).json({ success: true, message: 'Task cancelled.' });
  } catch (err) {
    next(err);
  }
};

exports.uploadBeforePhoto = async (req, res, next) => {
  try {
    let url = req.body.photo_url;
    if (req.file) url = await uploadImage(req.file.path || req.file.buffer, req.file.originalname);
    if (!url) return res.status(400).json({ success: false, message: 'No photo provided.' });

    await db.run('UPDATE cleaning_tasks SET before_photo_url = ? WHERE id = ?', [url, req.params.id]);
    res.status(200).json({ success: true, message: 'Before photo recorded.', before_photo_url: url });
  } catch (err) {
    next(err);
  }
};

exports.uploadAfterPhoto = async (req, res, next) => {
  try {
    let url = req.body.photo_url;
    if (req.file) url = await uploadImage(req.file.path || req.file.buffer, req.file.originalname);
    if (!url) return res.status(400).json({ success: false, message: 'No photo provided.' });

    await db.run('UPDATE cleaning_tasks SET after_photo_url = ? WHERE id = ?', [url, req.params.id]);
    res.status(200).json({ success: true, message: 'After photo recorded.', after_photo_url: url });
  } catch (err) {
    next(err);
  }
};
