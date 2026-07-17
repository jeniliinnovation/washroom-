const db = require('../config/db');
const qrService = require('../services/qrService');
const { uploadImage } = require('../config/cloudinary');

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

exports.getAllWashrooms = async (req, res, next) => {
  try {
    const { ward, status, lat, lng, radiusKm = 10 } = req.query;
    let query = 'SELECT * FROM washrooms WHERE 1=1';
    const params = [];

    if (ward) {
      query += ' AND ward = ?';
      params.push(ward);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    const washrooms = await db.all(query, params);

    const formatted = washrooms.map(w => {
      let facilities = [];
      try { facilities = w.facilities_json ? JSON.parse(w.facilities_json) : []; } catch (e) {}
      let distanceKm = null;
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        distanceKm = parseFloat(calculateDistance(parseFloat(lat), parseFloat(lng), w.latitude, w.longitude).toFixed(2));
      }
      return { ...w, facilities, distanceKm };
    });

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const filtered = formatted.filter(w => w.distanceKm <= parseFloat(radiusKm));
      filtered.sort((a, b) => a.distanceKm - b.distanceKm);
      return res.status(200).json({ success: true, count: filtered.length, washrooms: filtered });
    }

    res.status(200).json({ success: true, count: formatted.length, washrooms: formatted });
  } catch (err) {
    next(err);
  }
};

exports.getNearbyWashrooms = async (req, res, next) => {
  try {
    const { lat, lng, radiusKm = 5 } = req.query;
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Valid lat and lng query parameters required.' });
    }

    const all = await db.all('SELECT * FROM washrooms WHERE status = "Active"');
    const nearby = all.map(w => {
      let facilities = [];
      try { facilities = w.facilities_json ? JSON.parse(w.facilities_json) : []; } catch (e) {}
      const distanceKm = parseFloat(calculateDistance(parseFloat(lat), parseFloat(lng), w.latitude, w.longitude).toFixed(2));
      return { ...w, facilities, distanceKm };
    }).filter(w => w.distanceKm <= parseFloat(radiusKm));

    nearby.sort((a, b) => a.distanceKm - b.distanceKm);
    res.status(200).json({ success: true, count: nearby.length, washrooms: nearby });
  } catch (err) {
    next(err);
  }
};

exports.searchWashrooms = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(200).json({ success: true, washrooms: [] });
    const washrooms = await db.all(
      `SELECT * FROM washrooms WHERE name LIKE ? OR address LIKE ? OR ward LIKE ? OR area LIKE ? LIMIT 30`,
      [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
    );
    res.status(200).json({ success: true, count: washrooms.length, washrooms });
  } catch (err) {
    next(err);
  }
};

exports.getMapWashrooms = async (req, res, next) => {
  try {
    const washrooms = await db.all('SELECT id, name, address, ward, latitude, longitude, cleanliness_score, status, opening_hours FROM washrooms');
    res.status(200).json({ success: true, count: washrooms.length, map_markers: washrooms });
  } catch (err) {
    next(err);
  }
};

exports.getWashroomById = async (req, res, next) => {
  try {
    const washroom = await db.get('SELECT * FROM washrooms WHERE id = ?', [req.params.id]);
    if (!washroom) return res.status(404).json({ success: false, message: 'Washroom not found.' });

    let facilities = [];
    try { facilities = washroom.facilities_json ? JSON.parse(washroom.facilities_json) : []; } catch (e) {}

    const images = await db.all('SELECT * FROM washroom_images WHERE washroom_id = ? ORDER BY created_at DESC', [washroom.id]);
    const reviews = await db.all(
      `SELECT r.*, u.name as citizen_name FROM reviews r LEFT JOIN users u ON r.citizen_id = u.id WHERE r.washroom_id = ? ORDER BY r.created_at DESC`,
      [washroom.id]
    );

    res.status(200).json({
      success: true,
      washroom: { ...washroom, facilities, images, reviews }
    });
  } catch (err) {
    next(err);
  }
};

exports.createWashroom = async (req, res, next) => {
  try {
    const { name, address, ward, area, latitude, longitude, qr_code_id, facilities = [], opening_hours = '24/7' } = req.body;
    if (!name || !address || !ward || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Name, address, ward, latitude, and longitude required.' });
    }

    const qrCode = qr_code_id || `QR-WASH-${Date.now().toString().slice(-4)}`;
    const facilitiesJson = JSON.stringify(Array.isArray(facilities) ? facilities : [facilities]);

    const result = await db.run(
      `INSERT INTO washrooms (name, address, ward, area, latitude, longitude, qr_code_id, cleanliness_score, status, facilities_json, opening_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?, 100, 'Active', ?, ?)`,
      [name, address, ward, area || null, latitude, longitude, qrCode, facilitiesJson, opening_hours]
    );

    const wId = result.lastInsertRowid;
    await qrService.generateQrCode(qrCode, wId, name);

    res.status(201).json({
      success: true,
      message: 'Washroom created successfully and QR code catalogued!',
      washroom: { id: wId, name, address, ward, latitude, longitude, qr_code_id: qrCode }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateWashroom = async (req, res, next) => {
  try {
    const { name, address, ward, area, latitude, longitude, cleanliness_score, status, facilities, opening_hours } = req.body;
    let facilitiesJson = undefined;
    if (facilities !== undefined) {
      facilitiesJson = JSON.stringify(Array.isArray(facilities) ? facilities : [facilities]);
    }

    await db.run(
      `UPDATE washrooms SET 
        name = COALESCE(?, name), address = COALESCE(?, address), ward = COALESCE(?, ward), area = COALESCE(?, area),
        latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude), cleanliness_score = COALESCE(?, cleanliness_score),
        status = COALESCE(?, status), facilities_json = COALESCE(?, facilities_json), opening_hours = COALESCE(?, opening_hours)
       WHERE id = ?`,
      [name || null, address || null, ward || null, area || null, latitude !== undefined ? latitude : null, longitude !== undefined ? longitude : null, cleanliness_score !== undefined ? cleanliness_score : null, status || null, facilitiesJson || null, opening_hours || null, req.params.id]
    );

    const updated = await db.get('SELECT * FROM washrooms WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Washroom updated successfully.', washroom: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteWashroom = async (req, res, next) => {
  try {
    await db.run('DELETE FROM washrooms WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Washroom deleted.' });
  } catch (err) {
    next(err);
  }
};

exports.getWashroomImages = async (req, res, next) => {
  try {
    const images = await db.all('SELECT * FROM washroom_images WHERE washroom_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.status(200).json({ success: true, count: images.length, images });
  } catch (err) {
    next(err);
  }
};

exports.uploadWashroomImage = async (req, res, next) => {
  try {
    let url = req.body.image_url;
    if (req.file) {
      url = await uploadImage(req.file.path || req.file.buffer, req.file.originalname);
    }
    if (!url) {
      return res.status(400).json({ success: false, message: 'No image provided.' });
    }

    const result = await db.run(
      'INSERT INTO washroom_images (washroom_id, image_url, caption, uploaded_by_user_id) VALUES (?, ?, ?, ?)',
      [req.params.id, url, req.body.caption || 'Washroom Photo', req.user ? req.user.id : null]
    );

    res.status(201).json({
      success: true,
      message: 'Washroom image uploaded successfully!',
      image: { id: result.lastInsertRowid, washroom_id: req.params.id, image_url: url, caption: req.body.caption }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteWashroomImage = async (req, res, next) => {
  try {
    await db.run('DELETE FROM washroom_images WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Image deleted from gallery.' });
  } catch (err) {
    next(err);
  }
};
