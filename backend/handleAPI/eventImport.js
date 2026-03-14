const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { createEvent, findLatestEventId, updateByEventId } = require('../dao/eventsDao');
const { createSessionWithRound, updateSessionById } = require('../dao/eventSessionsDao');
const { createUser, findUserByMobile, findUserByEmail, findLatestId } = require('../dao/usersDao');
const { createEnrollment, findIfExist, updateStatusByEnrollmentId } = require('../dao/eventEnrollmentsDao');
const { createRegistration, findBySessionAndUser } = require('../dao/sessionRegistrationsDao');
const { createAttendance, findLatestByRegistrationId } = require('../dao/eventAttendanceDao');
const { createPayment } = require('../dao/paymentsDao');
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
      capacity: 60,
      remaining_seats: 60,
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

    const parseBaseDate = (val) => {
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
        const m2 = datePart.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
        if (m2) {
          return new Date(parseInt(m2[1], 10), parseInt(m2[2], 10) - 1, parseInt(m2[3], 10));
        }
        const m1 = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
        if (m1) {
          let year = parseInt(m1[3], 10);
          if (year < 100) year += 2000;
          return new Date(year, parseInt(m1[2], 10) - 1, parseInt(m1[1], 10));
        }
      }
      return null;
    };

    const parsePaymentTime = (val) => {
      if (!val) return null;
      if (val instanceof Date && !Number.isNaN(val.getTime())) return val;
      if (typeof val === 'number') {
        const parsed = xlsx.SSF.parse_date_code(val);
        if (!parsed?.y) return null;
        return new Date(
          parsed.y,
          (parsed.m || 1) - 1,
          parsed.d || 1,
          parsed.H || 0,
          parsed.M || 0,
          parsed.S || 0
        );
      }
      if (typeof val === 'string') {
        const d = new Date(val.trim());
        if (!Number.isNaN(d.getTime())) return d;
      }
      return null;
    };

    const resolveSessionDateByBase = (day, month, baseDate) => {
      if (!baseDate || Number.isNaN(baseDate.getTime())) {
        return new Date(new Date().getFullYear(), month - 1, day);
      }
      const base = new Date(baseDate);
      base.setHours(0, 0, 0, 0);
      const baseYear = base.getFullYear();
      const candidate = new Date(baseYear, month - 1, day);
      if (candidate >= base) return candidate;
      return new Date(baseYear + 1, month - 1, day);
    };

    const parseHeaderDate = (val, baseDate) => {
      if (!val) return null;
      if (val instanceof Date && !Number.isNaN(val.getTime())) {
        const day = val.getDate();
        const month = val.getMonth() + 1;
        return resolveSessionDateByBase(day, month, baseDate);
      }
      if (typeof val === 'number') {
        const parsed = xlsx.SSF.parse_date_code(val);
        if (!parsed?.y) return null;
        return resolveSessionDateByBase(parsed.d, parsed.m, baseDate);
      }
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (!trimmed) return null;
        const datePart = trimmed.split(' ')[0];
        const m2 = datePart.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
        if (m2) {
          const month = parseInt(m2[2], 10);
          const day = parseInt(m2[3], 10);
          return resolveSessionDateByBase(day, month, baseDate);
        }
        const m1 = datePart.match(/^(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?$/);
        if (m1) {
          const day = parseInt(m1[1], 10);
          const month = parseInt(m1[2], 10);
          return resolveSessionDateByBase(day, month, baseDate);
        }
      }
      return null;
    };

    const baseCell = getCell('A', 2);
    const baseRaw = baseCell?.v ?? baseCell?.w ?? null;
    const baseDate = parseBaseDate(baseRaw);

    const formatDateTimeLocal = (dateObj) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:00`;
    };

    const hasAppliedAndAttendedFlag = (val) => {
      if (val === 1) return true;
      if (typeof val === 'string') {
        const normalized = val.trim();
        return normalized === '1' || normalized === '1.0';
      }
      return false;
    };

    const isNotNullCell = (val) => {
      if (val == null) return false;
      if (typeof val === 'string') return val.trim() !== '';
      return true;
    };

    const toNumberOrNull = (val) => {
      if (val == null) return null;
      if (typeof val === 'number') return Number.isFinite(val) ? val : null;
      if (typeof val === 'string') {
        const raw = val.trim();
        if (!raw) return null;
        const n = Number(raw.replace(/,/g, ''));
        return Number.isFinite(n) ? n : null;
      }
      return null;
    };

    const normalizePaymentMethod = (val) => {
      if (!isNotNullCell(val)) return null;
      const raw = String(val).trim();
      const normalized = raw.toUpperCase().replace(/\s+/g, '');
      if (normalized === 'CREDITCARD' || normalized === '信用卡') return 'CREDITCARD';
      if (normalized === 'FPS') return 'FPS';
      if (normalized === 'PAYME') return 'PAYME';
      if (normalized === 'CASH' || normalized === '現金') return 'CASH';
      return null;
    };

    const sessionsCreated = [];
    const sessionByColumn = {};
    for (const set of columnSets) {
      for (let i = 0; i < set.cols.length; i += 1) {
        const col = set.cols[i];
        const cell = getCell(col, 0);
        const rawVal = cell?.w ?? cell?.v ?? null;
        const date = parseHeaderDate(rawVal, baseDate);
        if (!date) continue;

        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 0, 0);

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
        sessionByColumn[col] = session;
      }
    }

    let nextUserId = parseInt(await findLatestId(), 10) || 49999;

    const summary = {
      totalRows: rows.length,
      createdUsers: 0,
      existingUsers: 0,
      createdEnrollments: 0,
      createdRegistrations: 0,
      createdAttendances: 0,
      createdPayments: 0,
      skippedRows: [],
    };

    const sessionRegistrationUsers = {}; // { [sessionId]: Set<user_id> }

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
      let enrollmentId = exists?.enrollment_id || null;
      if (!exists) {
        const enrollment = await createEnrollment({
          event_id: createdEvent.event_id,
          user_id: user.user_id,
          enroll_by_id: req.user.sub,
        });
        await updateStatusByEnrollmentId(enrollment.enrollment_id, 'CONFIRMED');
        enrollmentId = enrollment.enrollment_id;
        summary.createdEnrollments += 1;
      }

      // 建立 payment（依 Excel: D=amount, E=paid_amount, F=method, H=status, I=issued_receipt, W=issued_certificate）
      const amountCell = getCell('D', i + 1);
      const paidAmountCell = getCell('E', i + 1);
      const methodCell = getCell('F', i + 1);
      const statusCell = getCell('G', i + 1);
      const issuedReceiptCell = getCell('I', i + 1);
      const issuedCertificateCell = getCell('W', i + 1);
      const paidTimeCell = getCell('A', i + 1);

      const amount = toNumberOrNull(amountCell?.v ?? amountCell?.w ?? null);
      const paid_amount = toNumberOrNull(paidAmountCell?.v ?? paidAmountCell?.w ?? null);
      const method = normalizePaymentMethod(methodCell?.v ?? methodCell?.w ?? null);
      const paid_time = parsePaymentTime(paidTimeCell?.v ?? paidTimeCell?.w ?? null);
      const statusRaw = statusCell?.v ?? statusCell?.w ?? null;
      const statusText = String(statusRaw ?? '').trim().toUpperCase().replace(/\s+/g, '');
      const status = (isNotNullCell(statusRaw) && statusText !== 'HK$0' && statusText !== 'HKD0' && statusText !== '0')
        ? 'OUTSTANDING'
        : 'COMPLETED';
      const issued_receipt = isNotNullCell(issuedReceiptCell?.v ?? issuedReceiptCell?.w ?? null);
      const issued_certificate = isNotNullCell(issuedCertificateCell?.v ?? issuedCertificateCell?.w ?? null);

      if (amount != null || paid_amount != null || method != null || issued_receipt || issued_certificate) {
        await createPayment({
          event_id: createdEvent.event_id,
          user_id: user.user_id,
          enrollment_id: enrollmentId,
          amount,
          paid_amount,
          method,
          paid_time,
          status,
          issued_receipt,
          issued_certificate,
        });
        summary.createdPayments += 1;
      }

      // X-AM 欄位值為 1：代表已報名且已出席，建立 registration + attendance
      for (const set of columnSets) {
        for (const col of set.cols) {
          const session = sessionByColumn[col];
          if (!session?.session_id) continue;

          const flagCell = getCell(col, i + 1); // 第1列是header，資料從第2列開始
          const flagVal = flagCell?.v ?? flagCell?.w ?? null;
          if (!hasAppliedAndAttendedFlag(flagVal)) continue;

          let registration = await findBySessionAndUser(session.session_id, user.user_id);
          if (!registration) {
            registration = await createRegistration({
              session_id: session.session_id,
              user_id: user.user_id,
              channel: 'WEB',
              registration_by_id: req.user?.sub || null,
              registration_time: session.datetime_start || null,
              status: 'REGISTERED',
            });
            summary.createdRegistrations += 1;
          }

          if (!sessionRegistrationUsers[session.session_id]) {
            sessionRegistrationUsers[session.session_id] = new Set();
          }
          sessionRegistrationUsers[session.session_id].add(String(user.user_id));

          const latestAttendance = await findLatestByRegistrationId(registration.registration_id);
          if (!latestAttendance) {
            await createAttendance({
              registration_id: registration.registration_id,
              attend_time: session.datetime_start || null,
              status: 'G',
              remarks: 'Imported from Excel (flag=1)',
            });
            summary.createdAttendances += 1;
          }
        }
      }
    }

    // 根據匯入後的人數更新活動與場次的 remaining_seats
    const eventCapacity = Number(createdEvent.capacity) || 60;
    const eventRemainingSeats = Math.max(0, eventCapacity - summary.createdEnrollments);
    let eventStart = null;
    let eventEnd = null;
    if (sessionsCreated.length > 0) {
      const starts = sessionsCreated
        .map((s) => (s?.datetime_start ? new Date(s.datetime_start) : null))
        .filter((d) => d && !Number.isNaN(d.getTime()));
      const ends = sessionsCreated
        .map((s) => (s?.datetime_end ? new Date(s.datetime_end) : null))
        .filter((d) => d && !Number.isNaN(d.getTime()));

      if (starts.length > 0) {
        eventStart = new Date(Math.min(...starts.map((d) => d.getTime())));
      }
      if (ends.length > 0) {
        eventEnd = new Date(Math.max(...ends.map((d) => d.getTime())));
      }
    }

    await updateByEventId(createdEvent.event_id, {
      remaining_seats: eventRemainingSeats,
      datetime_start: eventStart ? formatDateTimeLocal(eventStart) : null,
      datetime_end: eventEnd ? formatDateTimeLocal(eventEnd) : null,
    });

    for (const session of sessionsCreated) {
      const sessionCapacity = Number(session.capacity) || 60;
      const registeredCount = sessionRegistrationUsers[session.session_id]?.size || 0;
      const sessionRemainingSeats = Math.max(0, sessionCapacity - registeredCount);
      await updateSessionById(session.session_id, { remaining_seats: sessionRemainingSeats });
    }

    summary.eventRemainingSeats = eventRemainingSeats;

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
