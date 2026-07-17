const db = require('../config/db');
const aiService = require('../services/aiService');

exports.analyzeImage = async (req, res, next) => {
  try {
    const { washroom_id, image_url } = req.body;
    if (!washroom_id) {
      return res.status(400).json({ success: false, message: 'washroom_id required.' });
    }

    const dirtyRes = await aiService.detectDirty(image_url || '/sample/default.jpg');
    const damageRes = await aiService.detectDamage(image_url || '/sample/default.jpg');

    await db.run(
      `INSERT INTO ai_analysis_results (washroom_id, image_url, cleanliness_score, damage_detected, detected_tags_json, raw_response_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        washroom_id,
        image_url || '/sample/default.jpg',
        dirtyRes.cleanliness_score,
        damageRes.damage_detected ? 1 : 0,
        JSON.stringify([...dirtyRes.detected_hazards, ...damageRes.detected_damage_list]),
        JSON.stringify({ dirty: dirtyRes, damage: damageRes })
      ]
    );

    res.status(200).json({
      success: true,
      analysis: {
        cleanliness_score: dirtyRes.cleanliness_score,
        is_dirty: dirtyRes.is_dirty,
        detected_hazards: dirtyRes.detected_hazards,
        damage_detected: damageRes.damage_detected,
        damage_list: damageRes.detected_damage_list,
        auto_priority: dirtyRes.cleanliness_score < 40 || damageRes.damage_detected ? 'Urgent' : 'Medium'
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.detectDirty = async (req, res, next) => {
  try {
    const { image_url } = req.body;
    const result = await aiService.detectDirty(image_url || '/sample/default.jpg');
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.imageScore = async (req, res, next) => {
  try {
    const { image_url } = req.body;
    const result = await aiService.getImageScore(image_url || '/sample/default.jpg');
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.detectDamage = async (req, res, next) => {
  try {
    const { image_url } = req.body;
    const result = await aiService.detectDamage(image_url || '/sample/default.jpg');
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.chat = async (req, res, next) => {
  try {
    const { query, message } = req.body;
    const result = await aiService.chat(query || message);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.summarize = async (req, res, next) => {
  try {
    const { description, text } = req.body;
    const result = await aiService.summarize(description || text);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.priority = async (req, res, next) => {
  try {
    const { category, description, cleanliness_score } = req.body;
    const priority = await aiService.predictPriority(category, description, cleanliness_score);
    res.status(200).json({ success: true, predicted_priority: priority });
  } catch (err) { next(err); }
};

exports.duplicate = async (req, res, next) => {
  try {
    const { washroom_id, lat, lng } = req.body;
    const result = await aiService.checkDuplicates(washroom_id, lat, lng);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};

exports.moderation = async (req, res, next) => {
  try {
    const { text, review_text, image_url } = req.body;
    const result = await aiService.moderateContent(text || review_text, image_url);
    res.status(200).json({ success: true, ...result });
  } catch (err) { next(err); }
};
