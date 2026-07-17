const qrService = require('../services/qrService');

exports.generateQr = async (req, res, next) => {
  try {
    const { code_id, washroom_id, facility_name } = req.body;
    if (!code_id) {
      return res.status(400).json({ success: false, message: 'code_id is required.' });
    }
    const result = await qrService.generateQrCode(code_id, washroom_id, facility_name);
    res.status(201).json({ success: true, message: result.status, qr: result });
  } catch (err) {
    next(err);
  }
};

exports.getQrByWashroomId = async (req, res, next) => {
  try {
    const result = await qrService.getQrByWashroomId(req.params.washroomId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'QR code not found for this washroom ID.' });
    }
    res.status(200).json({ success: true, qr: result });
  } catch (err) {
    next(err);
  }
};

exports.scanQr = async (req, res, next) => {
  try {
    const { code_id } = req.body;
    if (!code_id) {
      return res.status(400).json({ success: false, message: 'code_id is required to scan.' });
    }
    const result = await qrService.scanQrCode(code_id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'QR sticker code invalid or washroom not registered.' });
    }
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
