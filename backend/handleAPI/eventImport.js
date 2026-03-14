const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { createEvent, findLatestEventId } = require('../dao/eventsDao');
const { createSessionWithRound } = require('../dao/eventSessionsDao');
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
    const inputName = String(req.body?.event_name || '').trim();
    const inputPriceRaw = req.body?.price;
    const parsedPrice = inputPriceRaw === '' || inputPriceRaw == null ? null : Number(inputPriceRaw);
    const latestEventId = parseInt(await findLatestEventId(), 10);
    const event_id = (latestEventId || 100) + 1;
    const newEvent = {
      event_id,
      event_name: inputName || baseName,
      type: 'CLASS',
      status: 'SCHEDULED',
      description: 'Imported from Excel',
      price: Number.isFinite(parsedPrice) ? parsedPrice : null,
      capacity: null,
      remaining_seats: null,
    };
    const createdEvent = await createEvent(newEvent);
    const columnSets = [
      { round: 1, cols: ['X', 'Y', 'Z', 'AA'] },
      { round: 2, cols: ['AB', 'AC', 'AD', 'AE'] },
      { round: 3, cols: ['AF', 'AG', 'AH', 'AI'] },
      { round: 4, cols: ['AJ', 'AK', 'AL', 'AM'] },
    ];

    const getCell = (col, rowIndex) => {
      const addr = `${col}${rowIndex + 1}`;
      return sheet[addr] || null;
    };

    const parseHeaderDate = (val) => {
      if (!val) return null;
      if (val instanceof Date && !Number.isNaN(val.getTime())) return val;
      if (typeof val === 'number') {
        const parsed = xlsx.SSF.parse_date_code(val);
        if (!parsed?.y) return null;
        return new Date(parsed.y, parsed.m - 1, parsed.d);
      }
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (!trimmed) return null;
        const datePart = trimmed.split(' ')[0];
        const m1 = datePart.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
        if (m1) {
          const day = parseInt(m1[1], 10);
          const month = parseInt(m1[2], 10);
          let year = new Date().getFullYear();
          if (m1[3]) {
            year = parseInt(m1[3], 10);
            if (year < 100) year += 2000;
          }
          return new Date(year, month - 1, day);
        }
      }
      return null;
    };

    const headerRowIndex = 0;

    const formatDateTimeLocal = (dateObj) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:00`;
    };

    const sessionsCreated = [];
    for (const set of columnSets) {
      for (let i = 0; i < set.cols.length; i += 1) {
        const col = set.cols[i];
        const cell = getCell(col, headerRowIndex);
        const rawVal = cell?.w ?? cell?.v ?? null;
        const date = parseHeaderDate(rawVal);
        if (!date) continue;

        const start = new Date(date);
        start.setHours(9, 0, 0, 0);
        const end = new Date(start.getTime() + 30 * 60 * 1000);

        const labNumber = i + 1;
        const session = await createSessionWithRound({
          event_id: createdEvent.event_id,
          session_name: `lab${labNumber}`,
          description: null,
          capacity: 60,
          remaining_seats: 60,
          datetime_start: formatDateTimeLocal(start),
          datetime_end: formatDateTimeLocal(end),
          round: set.round,
          created_by_id: req.user?.sub || null,
        });
        sessionsCreated.push(session);
      }
    }

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
          source: 'Excel匯入',
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
      sessions: sessionsCreated,
      summary,
    });
  } catch (error) {
    console.error('Import students failed:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
