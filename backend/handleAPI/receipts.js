const express = require('express');
const multer = require('multer');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const azureBlobService = require('../services/azureBlobService');
const { updatePaymentById } = require('../dao/paymentsDao');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

router.post('/receipts/upload', authMiddleware, roleMiddleware('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未選擇檔案' });
    }

    const eventId = parseInt(req.body.eventId, 10);
    const userId = parseInt(req.body.userId, 10);
    const paymentId = req.body.paymentId ? parseInt(req.body.paymentId, 10) : null;

    if (!eventId || !userId) {
      return res.status(400).json({ error: '缺少活動ID或使用者ID' });
    }

    const uploadResult = await azureBlobService.uploadReceiptFile(req.file, eventId, userId);
    if (!uploadResult.success) {
      return res.status(500).json({ error: uploadResult.error || '上傳收據失敗' });
    }

    let updatedPayment = null;
    if (paymentId) {
      updatedPayment = await updatePaymentById(paymentId, { issued_receipt: true });
    }

    return res.json({
      success: true,
      fileName: uploadResult.fileName,
      originalName: uploadResult.originalName,
      payment: updatedPayment
    });
  } catch (error) {
    console.error('Upload receipt failed:', error);
    return res.status(500).json({ error: '伺服器錯誤' });
  }
});

router.get('/receipts/my-files', authMiddleware, async (req, res) => {
  try {
    const listResult = await azureBlobService.listAllFiles('receipts');
    if (!listResult.success) {
      return res.status(500).json({ error: listResult.error || '獲取收據清單失敗' });
    }

    const userId = String(req.user.sub);
    const files = (listResult.files || []).map((f) => {
      const meta = f.metadata || {};
      return {
        fileName: f.name,
        originalName: meta.originalName || meta.originalname || f.name.split('/').pop(),
        eventId: meta.eventId || meta.eventid || null,
        userId: meta.userId || meta.userid || null,
        uploadDate: meta.uploadDate || meta.uploaddate || null
      };
    }).filter((f) => String(f.userId || '') === userId);

    return res.json({ files });
  } catch (error) {
    console.error('List receipts failed:', error);
    return res.status(500).json({ error: '伺服器錯誤' });
  }
});

router.get('/receipts/download', authMiddleware, async (req, res) => {
  try {
    const fileName = req.query.fileName;
    if (!fileName) {
      return res.status(400).json({ error: '缺少檔案名稱' });
    }

    const downloadResult = await azureBlobService.downloadFile(fileName, 'receipts');
    if (!downloadResult.success) {
      return res.status(404).json({ error: downloadResult.error || '找不到收據檔案' });
    }

    const metaUserId = downloadResult.metadata?.userId || downloadResult.metadata?.userid;
    if (metaUserId && String(metaUserId) !== String(req.user.sub)) {
      return res.status(403).json({ error: '無權限下載此收據' });
    }

    const filename = downloadResult.originalName || 'receipt';
    res.setHeader('Content-Type', downloadResult.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    return res.send(downloadResult.data);
  } catch (error) {
    console.error('Download receipt failed:', error);
    return res.status(500).json({ error: '伺服器錯誤' });
  }
});

module.exports = router;
