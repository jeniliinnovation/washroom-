const reportService = require('../services/reportService');

exports.getDaily = async (req, res, next) => {
  try {
    const report = await reportService.getDailyReport(req.query.date);
    res.status(200).json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

exports.getWeekly = async (req, res, next) => {
  try {
    const report = await reportService.getSummaryReport('weekly');
    res.status(200).json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

exports.getMonthly = async (req, res, next) => {
  try {
    const report = await reportService.getSummaryReport('monthly');
    res.status(200).json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

exports.getYearly = async (req, res, next) => {
  try {
    const report = await reportService.getSummaryReport('yearly');
    res.status(200).json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

exports.exportPdf = async (req, res, next) => {
  try {
    const pdfSummary = await reportService.generatePdfSummary();
    res.status(200).json({ success: true, export_type: 'PDF_STRUCTURED_SUMMARY', pdf_document: pdfSummary });
  } catch (err) {
    next(err);
  }
};

exports.exportExcel = async (req, res, next) => {
  try {
    const csvData = await reportService.generateCsvExport();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="municipal_complaints_export.csv"');
    res.status(200).send(csvData);
  } catch (err) {
    next(err);
  }
};
