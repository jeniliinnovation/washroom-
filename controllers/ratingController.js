const db = require('../config/db');

exports.getRatings = async (req, res, next) => {
  try {
    const { washroom_id } = req.query;
    let query = `
      SELECT washroom_id, 
             AVG(cleanliness_rating) as avg_cleanliness,
             AVG(smell_rating) as avg_smell,
             AVG(water_availability_rating) as avg_water,
             COUNT(*) as total_ratings
      FROM ratings WHERE 1=1
    `;
    const params = [];
    if (washroom_id) {
      query += ' AND washroom_id = ?';
      params.push(washroom_id);
    }
    query += ' GROUP BY washroom_id';
    const ratings = await db.all(query, params);
    res.status(200).json({ success: true, count: ratings.length, ratings });
  } catch (err) {
    next(err);
  }
};

exports.createRating = async (req, res, next) => {
  try {
    const { washroom_id, cleanliness_rating, smell_rating, water_availability_rating } = req.body;
    if (!washroom_id || cleanliness_rating === undefined) {
      return res.status(400).json({ success: false, message: 'washroom_id and cleanliness_rating required.' });
    }
    const citizenId = req.user ? req.user.id : null;
    const resIns = await db.run(
      'INSERT INTO ratings (washroom_id, cleanliness_rating, smell_rating, water_availability_rating, citizen_id) VALUES (?, ?, ?, ?, ?)',
      [washroom_id, cleanliness_rating, smell_rating || cleanliness_rating, water_availability_rating || cleanliness_rating, citizenId]
    );

    res.status(201).json({
      success: true,
      message: 'Multi-dimensional rating recorded.',
      rating: { id: resIns.lastInsertRowid, washroom_id, cleanliness_rating, smell_rating, water_availability_rating }
    });
  } catch (err) {
    next(err);
  }
};
