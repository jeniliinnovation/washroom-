const db = require('../config/db');
const { uploadImage } = require('../config/cloudinary');

exports.getComplaintMedia = async (req, res, next) => {
  try {
    const media = await db.all('SELECT * FROM complaint_media WHERE complaint_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.status(200).json({ success: true, count: media.length, media });
  } catch (err) {
    next(err);
  }
};

exports.uploadPhotos = async (req, res, next) => {
  try {
    const complaintId = req.params.id;
    const { stage = 'BEFORE', media_url } = req.body;

    let urls = [];
    if (media_url) urls.push(media_url);
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const u = await uploadImage(file.path || file.buffer, file.originalname);
        if (u) urls.push(u);
      }
    } else if (req.file) {
      const u = await uploadImage(req.file.path || req.file.buffer, req.file.originalname);
      if (u) urls.push(u);
    }

    if (urls.length === 0) {
      return res.status(400).json({ success: false, message: 'No photo provided or uploaded.' });
    }

    const inserted = [];
    for (const u of urls) {
      const resIns = await db.run(
        'INSERT INTO complaint_media (complaint_id, media_type, media_url, stage, uploaded_by_user_id) VALUES (?, ?, ?, ?, ?)',
        [complaintId, 'PHOTO', u, stage.toUpperCase(), req.user ? req.user.id : null]
      );
      inserted.push({ id: resIns.lastInsertRowid, complaint_id: complaintId, media_type: 'PHOTO', media_url: u, stage: stage.toUpperCase() });
    }

    res.status(201).json({ success: true, message: 'Photos uploaded to complaint media.', count: inserted.length, media: inserted });
  } catch (err) {
    next(err);
  }
};

exports.uploadVideos = async (req, res, next) => {
  try {
    const complaintId = req.params.id;
    const { stage = 'BEFORE', media_url } = req.body;

    let urls = [];
    if (media_url) urls.push(media_url);
    if (req.file) {
      // In production video upload can also route through cloudinary or local storage
      urls.push(req.file.path || '/uploads/videos/' + req.file.originalname);
    }

    if (urls.length === 0) {
      return res.status(400).json({ success: false, message: 'No video provided or uploaded.' });
    }

    const inserted = [];
    for (const u of urls) {
      const resIns = await db.run(
        'INSERT INTO complaint_media (complaint_id, media_type, media_url, stage, uploaded_by_user_id) VALUES (?, ?, ?, ?, ?)',
        [complaintId, 'VIDEO', u, stage.toUpperCase(), req.user ? req.user.id : null]
      );
      inserted.push({ id: resIns.lastInsertRowid, complaint_id: complaintId, media_type: 'VIDEO', media_url: u, stage: stage.toUpperCase() });
    }

    res.status(201).json({ success: true, message: 'Videos uploaded to complaint media.', count: inserted.length, media: inserted });
  } catch (err) {
    next(err);
  }
};

exports.deleteMedia = async (req, res, next) => {
  try {
    await db.run('DELETE FROM complaint_media WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Media entry deleted.' });
  } catch (err) {
    next(err);
  }
};
