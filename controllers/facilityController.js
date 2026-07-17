const db = require('../config/db');

exports.getFacilities = async (req, res, next) => {
  try {
    const facilities = await db.all('SELECT * FROM facilities ORDER BY id ASC');
    res.status(200).json({ success: true, count: facilities.length, facilities });
  } catch (err) {
    next(err);
  }
};

exports.createFacility = async (req, res, next) => {
  try {
    const { name, icon, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Facility name required.' });
    const result = await db.run('INSERT INTO facilities (name, icon, description) VALUES (?, ?, ?)', [name, icon || '♿', description || null]);
    res.status(201).json({ success: true, message: 'Facility created.', facility: { id: result.lastInsertRowid, name, icon, description } });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, message: 'Facility with this name already exists.' });
    }
    next(err);
  }
};

exports.updateFacility = async (req, res, next) => {
  try {
    const { name, icon, description } = req.body;
    await db.run('UPDATE facilities SET name = COALESCE(?, name), icon = COALESCE(?, icon), description = COALESCE(?, description) WHERE id = ?', [name || null, icon || null, description || null, req.params.id]);
    const updated = await db.get('SELECT * FROM facilities WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Facility updated.', facility: updated });
  } catch (err) {
    next(err);
  }
};

exports.deleteFacility = async (req, res, next) => {
  try {
    await db.run('DELETE FROM facilities WHERE id = ?', [req.params.id]);
    await db.run('DELETE FROM washroom_facilities WHERE facility_id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Facility deleted.' });
  } catch (err) {
    next(err);
  }
};

// Assign facility to washroom
exports.assignFacilityToWashroom = async (req, res, next) => {
  try {
    const washroomId = req.params.id;
    const { facility_id, facility_name } = req.body;

    let fId = facility_id;
    let fName = facility_name;
    if (!fId && fName) {
      const fac = await db.get('SELECT id FROM facilities WHERE name = ?', [fName]);
      if (fac) fId = fac.id;
    } else if (fId && !fName) {
      const fac = await db.get('SELECT name FROM facilities WHERE id = ?', [fId]);
      if (fac) fName = fac.name;
    }

    if (!fId) return res.status(400).json({ success: false, message: 'Valid facility_id or facility_name required.' });

    // Insert mapping
    await db.run('INSERT INTO washroom_facilities (washroom_id, facility_id) VALUES (?, ?)', [washroomId, fId]);

    // Update washroom facilities_json
    const w = await db.get('SELECT facilities_json FROM washrooms WHERE id = ?', [washroomId]);
    if (w) {
      let list = [];
      try { list = w.facilities_json ? JSON.parse(w.facilities_json) : []; } catch (e) {}
      if (fName && !list.includes(fName)) {
        list.push(fName);
        await db.run('UPDATE washrooms SET facilities_json = ? WHERE id = ?', [JSON.stringify(list), washroomId]);
      }
    }

    res.status(200).json({ success: true, message: 'Facility assigned to washroom.' });
  } catch (err) {
    next(err);
  }
};

// Remove facility from washroom
exports.removeFacilityFromWashroom = async (req, res, next) => {
  try {
    const { id: washroomId, facilityId } = req.params;
    const fac = await db.get('SELECT name FROM facilities WHERE id = ?', [facilityId]);
    await db.run('DELETE FROM washroom_facilities WHERE washroom_id = ? AND facility_id = ?', [washroomId, facilityId]);

    const w = await db.get('SELECT facilities_json FROM washrooms WHERE id = ?', [washroomId]);
    if (w && fac) {
      let list = [];
      try { list = w.facilities_json ? JSON.parse(w.facilities_json) : []; } catch (e) {}
      list = list.filter(n => n !== fac.name);
      await db.run('UPDATE washrooms SET facilities_json = ? WHERE id = ?', [JSON.stringify(list), washroomId]);
    }

    res.status(200).json({ success: true, message: 'Facility removed from washroom.' });
  } catch (err) {
    next(err);
  }
};
