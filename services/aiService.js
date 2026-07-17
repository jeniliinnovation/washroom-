const db = require('../config/db');

// Haversine formula for distance in meters
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

class AiService {
  async detectDirty(imageUrl) {
    const score = Math.floor(18 + Math.random() * 55);
    const hazards = [
      'Overflowing Water / Flooded Floor Detected',
      'Unsanitary Surface Accumulation & Stains',
      'Garbage Overflowing from Receptacle Bin',
      'Mud & Standing Water near Entrance'
    ];
    const detected = hazards.filter(() => Math.random() > 0.4);
    if (detected.length === 0) detected.push(hazards[0]);

    return {
      image_url: imageUrl,
      is_dirty: score < 60,
      cleanliness_score: score,
      detected_hazards: detected,
      confidence_score: 0.94
    };
  }

  async getImageScore(imageUrl) {
    const score = Math.floor(25 + Math.random() * 65);
    return {
      image_url: imageUrl,
      cleanliness_score: score,
      rating_label: score < 35 ? 'Unsanitary (Immediate Action Required)' : score < 65 ? 'Moderate Dirt / Attention Needed' : 'Clean & Sanitary Condition'
    };
  }

  async detectDamage(imageUrl) {
    const damages = [
      'Broken Toilet Seat / Cracked Lid',
      'Damaged Cubicle Door Lock / Latch',
      'Leaking Tap / Broken Washbasin Pipe',
      'Smashed Mirror / Wall Tile Damage'
    ];
    const found = damages.filter(() => Math.random() > 0.5);
    return {
      image_url: imageUrl,
      damage_detected: found.length > 0,
      detected_damage_list: found.length > 0 ? found : ['No physical structural damage detected'],
      severity: found.length > 1 ? 'High' : found.length === 1 ? 'Medium' : 'None'
    };
  }

  async chat(userQuery) {
    const query = (userQuery || '').toLowerCase();
    let reply = "Hello! I am your Smart Civic Washroom Assistant. How can I help you today?";
    
    if (query.includes('complaint') || query.includes('report') || query.includes('dirty')) {
      reply = "To submit a cleanliness report, simply scan the QR code sticker on the washroom door or visit our 'Submit Complaint' tab. You can attach before photos and our AI will automatically prioritize your request!";
    } else if (query.includes('status') || query.includes('track')) {
      reply = "You can track your active complaints anytime from your Citizen Dashboard using your complaint code (e.g., PWMS-2026-0001).";
    } else if (query.includes('nearby') || query.includes('where') || query.includes('toilet')) {
      reply = "Our GPS locator shows all nearby public washrooms within a 15km radius along with active facilities like Wheelchair Access and Baby Changing tables.";
    }

    return {
      query: userQuery,
      ai_response: reply,
      assistant_name: 'Swatch AI Assistant'
    };
  }

  async summarize(description) {
    if (!description || description.trim().length === 0) {
      return { original: '', summary: 'No description provided.', keywords: [] };
    }
    const clean = description.trim();
    return {
      original: clean,
      summary: `Civic issue reported: ${clean.substring(0, 80)}${clean.length > 80 ? '...' : ''}`,
      keywords: ['cleanliness', 'civic_report', 'maintenance']
    };
  }

  async predictPriority(category, description, cleanlinessScore) {
    if (cleanlinessScore && cleanlinessScore < 30) return 'Urgent';
    const text = `${category || ''} ${description || ''}`.toLowerCase();
    if (text.includes('overflow') || text.includes('flood') || text.includes('urgent') || text.includes('broken tap')) {
      return 'Urgent';
    } else if (text.includes('broken') || text.includes('smell') || text.includes('odor') || text.includes('dirty')) {
      return 'High';
    } else if (text.includes('soap') || text.includes('tissue') || text.includes('empty')) {
      return 'Low';
    }
    return 'Medium';
  }

  async checkDuplicates(washroomId, lat, lng) {
    let matches = [];
    if (washroomId) {
      matches = await db.all(
        `SELECT id, complaint_code, category, status, created_at FROM complaints 
         WHERE washroom_id = ? AND status NOT IN ('Resolved', 'Closed', 'Rejected', 'Cancelled') AND created_at >= DATETIME('now', '-1 day')`,
        [washroomId]
      );
    } else if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const recent = await db.all(
        `SELECT id, complaint_code, washroom_id, category, status, gps_lat, gps_lng, created_at FROM complaints 
         WHERE status NOT IN ('Resolved', 'Closed', 'Rejected', 'Cancelled') AND created_at >= DATETIME('now', '-1 day')`
      );
      matches = recent.filter(c => c.gps_lat && c.gps_lng && calculateDistanceMeters(parseFloat(lat), parseFloat(lng), c.gps_lat, c.gps_lng) <= 200);
    }
    return {
      potential_duplicates_found: matches.length,
      is_duplicate_likely: matches.length > 0,
      matching_complaints: matches
    };
  }

  async moderateContent(text, imageUrl) {
    const blockwords = ['spam', 'fake', 'abuse', 'hack'];
    const isClean = !blockwords.some(w => (text || '').toLowerCase().includes(w));
    return {
      content_checked: text || imageUrl || 'None',
      is_safe: isClean,
      flagged_reason: isClean ? null : 'Contains prohibited spam or abusive language',
      moderation_status: isClean ? 'APPROVED' : 'REJECTED'
    };
  }
}

module.exports = new AiService();
