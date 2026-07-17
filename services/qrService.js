const QRCode = require('qrcode');
const db = require('../config/db');

class QrService {
  async generateQrCode(codeId, washroomId, washroomName) {
    const textToEncode = JSON.stringify({
      portal: 'Clean Toilet Portal - civic reporting',
      qr_code_id: codeId,
      washroom_id: washroomId,
      facility_name: washroomName || `Public Toilet #${washroomId}`,
      report_url: `http://localhost:5000/report?qr=${codeId}`
    });

    // Generate Base64 Data URL PNG
    const dataUrl = await QRCode.toDataURL(textToEncode, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    // Check if entry exists in qr_codes
    const existing = await db.get('SELECT id FROM qr_codes WHERE code_id = ? OR washroom_id = ?', [codeId, washroomId]);
    if (existing) {
      await db.run('UPDATE qr_codes SET code_id = ?, qr_image_url = ? WHERE id = ?', [codeId, dataUrl, existing.id]);
    } else {
      await db.run('INSERT INTO qr_codes (code_id, washroom_id, qr_image_url) VALUES (?, ?, ?)', [codeId, washroomId, dataUrl]);
    }

    // Also update qr_code_id on washrooms table if washroomId exists
    if (washroomId) {
      await db.run('UPDATE washrooms SET qr_code_id = ? WHERE id = ?', [codeId, washroomId]);
    }

    return {
      code_id: codeId,
      washroom_id: washroomId,
      qr_image_url: dataUrl,
      status: 'QR Code successfully generated and catalogued'
    };
  }

  async getQrByWashroomId(washroomId) {
    const qr = await db.get('SELECT * FROM qr_codes WHERE washroom_id = ?', [washroomId]);
    if (!qr) {
      const washroom = await db.get('SELECT * FROM washrooms WHERE id = ?', [washroomId]);
      if (washroom && washroom.qr_code_id) {
        return await this.generateQrCode(washroom.qr_code_id, washroom.id, washroom.name);
      }
      return null;
    }
    return qr;
  }

  async scanQrCode(codeId) {
    const qr = await db.get('SELECT * FROM qr_codes WHERE code_id = ?', [codeId]);
    if (qr) {
      await db.run('UPDATE qr_codes SET scans_count = scans_count + 1 WHERE id = ?', [qr.id]);
    }

    const washroom = await db.get('SELECT * FROM washrooms WHERE qr_code_id = ? OR id = ?', [codeId, qr ? qr.washroom_id : -1]);
    if (!washroom) {
      return null;
    }

    let facilities = [];
    try { facilities = washroom.facilities_json ? JSON.parse(washroom.facilities_json) : []; } catch (e) {}

    const activeComplaints = await db.all(
      `SELECT id, complaint_code, category, priority, status, created_at FROM complaints 
       WHERE washroom_id = ? AND status NOT IN ('Resolved', 'Closed', 'Rejected', 'Cancelled') ORDER BY created_at DESC`,
      [washroom.id]
    );

    return {
      success: true,
      scans_count: qr ? (qr.scans_count || 0) + 1 : 1,
      washroom: {
        ...washroom,
        facilities,
        active_complaints: activeComplaints
      }
    };
  }
}

module.exports = new QrService();
