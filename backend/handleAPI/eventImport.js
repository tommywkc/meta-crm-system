const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { createEvent, findLatestEventId } = require('../dao/eventsDao');
const { createUser, findUserByMobile, findUserByEmail, findLatestId } = require('../dao/usersDao');
const { createEnrollment, findIfExist, updateStatusByEnrollmentId } = require('../dao/eventEnrollmentsDao');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');

const upload = multer({ storage: multer.memoryStorage() });

function normalizeMobileForStorage(mobile) {
  if (!mobile) return '';
  const digits = String(mobile).replace(/\D/g, '');
  if (digits.startsWith('852') && digits.length > 8) {
    return digits.slice(3);
  }
  return digits;
}

// import enrolled students from Excel (sheet: 已報名學生) and create event by filename
router.post('/events/import-students', authMiddleware, roleMiddleware('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '請上傳 Excel 檔案' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets['已報名學生'];
    if (!sheet) {
      return res.status(400).json({ message: '找不到工作表「已報名學生」' });
    }

    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const baseName = path.basename(originalName, path.extname(originalName));
    const latestEventId = parseInt(await findLatestEventId(), 10);
    const event_id = (latestEventId || 100) + 1;
    const newEvent = {
      event_id,
      event_name: baseName,
      type: 'CLASS',
      status: 'OPEN',
      description: 'Imported from Excel',
      capacity: null,
      remaining_seats: null,
    };
    const createdEvent = await createEvent(newEvent);

    let nextUserId = parseInt(await findLatestId(), 10) || 49999;

    const summary = {
      totalRows: rows.length,
      createdUsers: 0,
      existingUsers: 0,
      createdEnrollments: 0,
      skippedRows: [],
    };

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] || {};
      const name = row.Name || row['名稱'] || row['姓名'] || '';
      const rawMobile = row.Phone || row['電話'] || row['手機'] || '';
      const email = row.Email || row['電郵'] || null;
      const mobile = normalizeMobileForStorage(rawMobile);

      if (!name || !mobile) {
        summary.skippedRows.push({ row: i + 2, reason: '缺少姓名或電話' });
        continue;
      }

      let user = await findUserByMobile(mobile);
      if (!user && email) {
        user = await findUserByEmail(email);
      }

      if (!user) {
        nextUserId += 1;
        const created = await createUser({
          user_id: nextUserId,
          password: mobile,
          role: 'MEMBER',
          name,
          mobile,
          email,
          source: 'IMPORT',
        });
        user = created;
        summary.createdUsers += 1;
      } else {
        summary.existingUsers += 1;
      }

      const exists = await findIfExist(user.user_id, createdEvent.event_id);
      if (!exists) {
        const enrollment = await createEnrollment({
          event_id: createdEvent.event_id,
          user_id: user.user_id,
          enroll_by_id: req.user.sub,
        });
        await updateStatusByEnrollmentId(enrollment.enrollment_id, 'CONFIRMED');
        summary.createdEnrollments += 1;
      }
    }

    return res.status(201).json({
      message: '匯入完成',
      event: createdEvent,
      summary,
    });
  } catch (error) {
    console.error('Import students failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
