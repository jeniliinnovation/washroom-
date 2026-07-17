const db = require('../config/db');

exports.getReviews = async (req, res, next) => {
  try {
    const { washroom_id } = req.query;
    let query = 'SELECT r.*, u.name as citizen_name FROM reviews r LEFT JOIN users u ON r.citizen_id = u.id WHERE 1=1';
    const params = [];
    if (washroom_id) { query += ' AND r.washroom_id = ?'; params.push(washroom_id); }
    query += ' ORDER BY r.created_at DESC LIMIT 100';
    const reviews = await db.all(query, params);
    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (err) {
    next(err);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const { washroom_id, rating, review_text } = req.body;
    if (!washroom_id || !rating) {
      return res.status(400).json({ success: false, message: 'washroom_id and rating (1-5) required.' });
    }
    const citizenId = req.user ? req.user.id : null;
    const resIns = await db.run(
      'INSERT INTO reviews (washroom_id, citizen_id, rating, review_text) VALUES (?, ?, ?, ?)',
      [washroom_id, citizenId, rating, review_text || null]
    );
    await db.run(
      'INSERT INTO washroom_reviews (washroom_id, citizen_id, rating, review_text) VALUES (?, ?, ?, ?)',
      [washroom_id, citizenId, rating, review_text || null]
    );

    // Update washroom average rating
    const avgData = await db.get('SELECT COUNT(*) as cnt, AVG(rating) as avg FROM reviews WHERE washroom_id = ?', [washroom_id]);
    if (avgData && avgData.cnt > 0) {
      await db.run('UPDATE washrooms SET total_ratings = ?, avg_rating = ? WHERE id = ?', [avgData.cnt, parseFloat(avgData.avg.toFixed(1)), washroom_id]);
    }

    res.status(201).json({ success: true, message: 'Review published.', review: { id: resIns.lastInsertRowid, washroom_id, citizen_id: citizenId, rating, review_text } });
  } catch (err) {
    next(err);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const { rating, review_text } = req.body;
    await db.run('UPDATE reviews SET rating = COALESCE(?, rating), review_text = COALESCE(?, review_text) WHERE id = ?', [rating || null, review_text || null, req.params.id]);
    res.status(200).json({ success: true, message: 'Review updated.' });
  } catch (err) {
    next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    await db.run('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    await db.run('DELETE FROM washroom_reviews WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    next(err);
  }
};
