const express = require('express');
const multer = require('multer');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const azureBlobService = require('../services/azureBlobService');
const { updatePaymentById, findByPaymentId, findPaymentByEventAndUser } = require('../dao/paymentsDao');
const { findByUserId } = require('../dao/usersDao');
const { sendEmail } = require('../services/emailService');

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

router.post('/certificates/upload', authMiddleware, roleMiddleware('admin'), upload.single('file'), async (req, res) => {
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

    const uploadResult = await azureBlobService.uploadCertificateFile(req.file, eventId, userId);
    if (!uploadResult.success) {
      return res.status(500).json({ error: uploadResult.error || '上傳證書失敗' });
    }

    let updatedPayment = null;
    let targetPaymentId = paymentId;

    if (!targetPaymentId) {
      const payment = await findPaymentByEventAndUser(eventId, userId);
      if (payment) {
        targetPaymentId = payment.payment_id;
      }
    }

    if (targetPaymentId) {
      updatedPayment = await updatePaymentById(targetPaymentId, { issued_certificate: true });
    }

    // Notify the student that a certificate has been uploaded (email + in-app notification)
    try {
      const { createNotification } = require('../dao/notificationsDao');

      let targetUserId = userId;
      let eventInfo = null;

      if (targetPaymentId) {
        const payment = await findByPaymentId(targetPaymentId);
        if (payment) {
          targetUserId = payment.user_id || targetUserId;
          eventInfo = payment.event_name ? payment.event_name : null;
        }
      }

      const user = await findByUserId(targetUserId);
      const to = user && user.email;

      const subject = '證書已上載通知';
      const lines = [
        '您的課程證書已由管理員上載。',
        '',
        eventInfo ? `活動名稱：${eventInfo}` : `活動 ID：${eventId}`,
        `學員編號：${targetUserId}`,
        `檔案名稱：${uploadResult.originalName}`
      ];

      const text = lines.join('\n');

      if (to) {
        await sendEmail({
          to,
          subject,
          text
        });
      } else {
        console.warn(`User ${targetUserId} has no email configured, skip certificate upload email`);
      }

      await createNotification({
        user_id: targetUserId,
        description: text,
        template: subject
      });
    } catch (notifyError) {
      console.error('Failed to send certificate upload notification:', notifyError);
    }

    return res.json({
      success: true,
      fileName: uploadResult.fileName,
      originalName: uploadResult.originalName,
      payment: updatedPayment
    });
  } catch (error) {
    console.error('Upload certificate failed:', error);
    return res.status(500).json({ error: '伺服器錯誤' });
  }
});

router.get('/certificates/my-files', authMiddleware, async (req, res) => {
  try {
    const listResult = await azureBlobService.listAllFiles('certificates');
    if (!listResult.success) {
      return res.status(500).json({ error: listResult.error || '獲取證書清單失敗' });
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
    console.error('List certificates failed:', error);
    return res.status(500).json({ error: '伺服器錯誤' });
  }
});

router.get('/certificates/download', authMiddleware, async (req, res) => {
  try {
    const fileName = req.query.fileName;
    if (!fileName) {
      return res.status(400).json({ error: '缺少檔案名稱' });
    }

    const downloadResult = await azureBlobService.downloadFile(fileName, 'certificates');
    if (!downloadResult.success) {
      return res.status(404).json({ error: downloadResult.error || '找不到證書檔案' });
    }

    const metaUserId = downloadResult.metadata?.userId || downloadResult.metadata?.userid;
    if (metaUserId && String(metaUserId) !== String(req.user.sub)) {
      return res.status(403).json({ error: '無權限下載此證書' });
    }

    const filename = downloadResult.originalName || 'certificate';
    res.setHeader('Content-Type', downloadResult.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    return res.send(downloadResult.data);
  } catch (error) {
    console.error('Download certificate failed:', error);
    return res.status(500).json({ error: '伺服器錯誤' });
  }
});

router.delete('/certificates/delete', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { eventId, userId, paymentId } = req.body;

    if (!eventId || !userId) {
      return res.status(400).json({ error: '缺少活動ID或使用者ID' });
    }

    // 1. Delete from Azure
    const deleteResult = await azureBlobService.deleteAllFilesWithPrefix('certificates', `${eventId}/${userId}/`);
    
    // 2. Update DB
    let targetPaymentId = paymentId;
    if (!targetPaymentId) {
      const payment = await findPaymentByEventAndUser(eventId, userId);
      if (payment) {
        targetPaymentId = payment.payment_id;
      }
    }

    if (targetPaymentId) {
      await updatePaymentById(targetPaymentId, { issued_certificate: false });
    } else {
      return res.status(404).json({ error: '找不到付款紀錄，無法更新狀態' });
    }

    res.json({ success: true, message: '證書已刪除' });

  } catch (err) {
    console.error('Delete certificate error:', err);
    res.status(500).json({ error: '系統錯誤' });
  }
});

module.exports = router;
