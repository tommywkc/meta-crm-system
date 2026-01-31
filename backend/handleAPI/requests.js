const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  createRequest,
  findPendingByUserAndSession,
  listAllRequests,
  listRequestsByUser,
  findByRequestId,
  updateRequestById,
} = require('../dao/requestsDao');
const { findBySessionAndUser, listSessionsByUserWithTimes } = require('../dao/sessionRegistrationsDao');
const { findBySessionId } = require('../dao/eventSessionsDao');
const { findByEventId } = require('../dao/eventsDao');
const { listHolidays } = require('../dao/holidaysDao');

const TYPE_MAP = {
  '請假申請': 'LEAVE',
  '改期申請': 'RESCHEDULE',
  '補堂申請': 'MAKEUP',
  '覆課申請': 'RETAKE',
  '取消申請': 'CANCEL',
};

const TYPE_RULES = {
  LEAVE: { requiresSession: true, requiresTarget: false, oldSessionFor: ['LEAVE'] },
  RESCHEDULE: { requiresSession: true, requiresTarget: true, oldSessionFor: ['RESCHEDULE'] },
  MAKEUP: { requiresSession: false, requiresTarget: true, oldSessionFor: [] },
  RETAKE: { requiresSession: false, requiresTarget: true, oldSessionFor: [] },
  CANCEL: { requiresSession: true, requiresTarget: false, oldSessionFor: [] },
};

const toDateOnly = (value) => {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const buildHolidaySet = (holidays = []) => {
  const set = new Set();
  holidays.forEach((holiday) => {
    if (!holiday?.holiday_date) return;
    const dateKey = new Date(holiday.holiday_date).toISOString().slice(0, 10);
    set.add(dateKey);
  });
  return set;
};

const countBusinessDays = (startDate, endDate, holidaySet) => {
  if (!startDate || !endDate) return 0;
  if (endDate < startDate) return 0;
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  if (!start || !end) return 0;

  let count = 0;
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  cursor.setDate(cursor.getDate() + 1);

  while (cursor <= end) {
    const day = cursor.getDay();
    const isWeekend = day === 0 || day === 6;
    const dateKey = cursor.toISOString().slice(0, 10);
    const isHoliday = holidaySet.has(dateKey);
    if (!isWeekend && !isHoliday) {
      count += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
};

const attachConflictDetails = async (requests = []) => {
  if (!Array.isArray(requests) || requests.length === 0) return requests;

  const enriched = await Promise.all(requests.map(async (req) => {
    if (!req?.conflict_id) return req;
    const conflictSession = await findBySessionId(req.conflict_id);
    if (!conflictSession) return req;
    const conflictEvent = conflictSession.event_id
      ? await findByEventId(conflictSession.event_id)
      : null;
    return {
      ...req,
      conflict_session_name: conflictSession.session_name || null,
      conflict_session_start: conflictSession.datetime_start || null,
      conflict_session_end: conflictSession.datetime_end || null,
      conflict_event_name: conflictEvent?.event_name || null,
    };
  }));

  return enriched;
};

router.post('/requests', authMiddleware, roleMiddleware(['admin', 'sales', 'leader', 'member']), async (req, res) => {
  try {
    const { requestType, memberId, sessionId, targetSessionId, reason } = req.body || {};
    const normalizedType = TYPE_MAP[requestType] || (requestType || '').trim().toUpperCase();
    const rules = TYPE_RULES[normalizedType];

    if (!rules) {
      return res.status(400).json({ message: '不支援的申請類型' });
    }

    const memberIdNum = parseInt(memberId, 10);
    if (Number.isNaN(memberIdNum)) {
      return res.status(400).json({ message: '缺少會員資訊' });
    }

    const requesterRole = (req.user.role || '').toUpperCase();
    const isSameMember = String(memberIdNum) === String(req.user.sub);
    if (requesterRole === 'MEMBER' && !isSameMember) {
      return res.status(403).json({ message: '會員僅可為自己提交申請' });
    }

    let sessionIdNum = null;
    if (sessionId !== undefined && sessionId !== null && sessionId !== '') {
      sessionIdNum = parseInt(sessionId, 10);
      if (Number.isNaN(sessionIdNum)) {
        return res.status(400).json({ message: '原場次資料有誤' });
      }
    }

    if (rules.requiresSession && !sessionIdNum) {
      return res.status(400).json({ message: '此申請需要選擇已報名的場次' });
    }

    let registrationId = null;
    if (sessionIdNum) {
      const registration = await findBySessionAndUser(sessionIdNum, memberIdNum);
      if (!registration) {
        return res.status(400).json({ message: '找不到此會員的場次報名紀錄' });
      }
      registrationId = registration.registration_id;
    }

    let targetSessionIdNum = null;
    if (targetSessionId !== undefined && targetSessionId !== null && targetSessionId !== '') {
      targetSessionIdNum = parseInt(targetSessionId, 10);
      if (Number.isNaN(targetSessionIdNum)) {
        return res.status(400).json({ message: '目標場次資料有誤' });
      }
    }

    if (rules.requiresTarget && !targetSessionIdNum) {
      return res.status(400).json({ message: '此申請需要選擇目標場次' });
    }

    if (targetSessionIdNum) {
      const existingTarget = await findBySessionAndUser(targetSessionIdNum, memberIdNum);
      if (existingTarget) {
        return res.status(400).json({ message: '此會員已報名目標場次，無法提交補堂／覆課申請' });
      }
    }

    const remarksInput = typeof reason === 'string' ? reason.trim() : '';
    const remarks = remarksInput ? remarksInput.slice(0, 255) : null;

    const duplicateOldSessionId = ['RESCHEDULE', 'LEAVE'].includes(normalizedType) ? sessionIdNum : null;
    const duplicateNewSessionId = ['RESCHEDULE', 'MAKEUP', 'RETAKE'].includes(normalizedType) ? targetSessionIdNum : null;

    const existing = await findPendingByUserAndSession(memberIdNum, {
      old_session_id: duplicateOldSessionId,
      new_session_id: duplicateNewSessionId,
    });

    if (existing) {
      return res.status(409).json({ message: '此會員已提交相同場次的申請，請先處理現有申請' });
    }

    let under_3bday = null;
    if ((normalizedType === 'LEAVE' || normalizedType === 'RESCHEDULE') && sessionIdNum) {
      const session = await findBySessionId(sessionIdNum);
      if (session?.datetime_start) {
        const event = session.event_id ? await findByEventId(session.event_id) : null;
        if (event?.type === 'CLASS') {
          const holidays = await listHolidays(5000, 0);
          const holidaySet = buildHolidaySet(holidays);
          const businessDays = countBusinessDays(new Date(), new Date(session.datetime_start), holidaySet);
          under_3bday = businessDays < 3;
        }
      }
    }

    let time_conflict = null;
    let conflict_id = null;
    if (targetSessionIdNum) {
      const targetSession = await findBySessionId(targetSessionIdNum);
      if (targetSession?.datetime_start) {
        const targetStart = new Date(targetSession.datetime_start);
        const targetEnd = targetSession.datetime_end ? new Date(targetSession.datetime_end) : new Date(targetSession.datetime_start);
        const otherSessions = await listSessionsByUserWithTimes(memberIdNum);

        for (const other of otherSessions) {
          if (!other?.session_id || !other?.datetime_start) continue;
          if (other.session_id === targetSessionIdNum) continue;
          if (sessionIdNum && String(other.session_id) === String(sessionIdNum)) continue;

          const otherStart = new Date(other.datetime_start);
          const otherEnd = other.datetime_end ? new Date(other.datetime_end) : new Date(other.datetime_start);

          if (targetStart < otherEnd && targetEnd > otherStart) {
            time_conflict = true;
            conflict_id = other.session_id;
            break;
          }
        }

        if (time_conflict === null) {
          time_conflict = false;
        }
      }
    }

    let request = await createRequest({
      request_type: normalizedType,
      registration_id: registrationId,
      user_id: memberIdNum,
      old_session_id: duplicateOldSessionId,
      new_session_id: duplicateNewSessionId,
      request_by_id: req.user.sub,
      status: 'PENDING',
      remarks,
      under_3bday,
      time_conflict,
      conflict_id,
    });

    if (request?.conflict_id) {
      const conflictSession = await findBySessionId(request.conflict_id);
      if (conflictSession) {
        const conflictEvent = conflictSession.event_id
          ? await findByEventId(conflictSession.event_id)
          : null;
        request = {
          ...request,
          conflict_session_name: conflictSession.session_name || null,
          conflict_session_start: conflictSession.datetime_start || null,
          conflict_session_end: conflictSession.datetime_end || null,
          conflict_event_name: conflictEvent?.event_name || null,
        };
      }
    }

    return res.status(201).json({ message: '申請已送出', request });
  } catch (error) {
    console.error('Create request failed:', error);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試' });
  }
});

router.get('/requests', authMiddleware, roleMiddleware(['admin', 'sales', 'leader', 'member']), async (req, res) => {
  try {
    const requesterRole = (req.user.role || '').toUpperCase();

    if (requesterRole === 'MEMBER') {
      const userIdNum = parseInt(req.user.sub, 10);
      if (Number.isNaN(userIdNum)) {
        return res.status(400).json({ message: '會員資訊有誤' });
      }
      const requests = await listRequestsByUser(userIdNum);
      const enriched = await attachConflictDetails(requests);
      return res.json({ requests: enriched });
    }

    const requests = await listAllRequests();
    const enriched = await attachConflictDetails(requests);
    return res.json({ requests: enriched });
  } catch (error) {
    console.error('List requests failed:', error);
    return res.status(500).json({ message: '無法載入申請列表' });
  }
});

router.put('/requests/:requestId', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId, 10);
    if (Number.isNaN(requestId)) {
      return res.status(400).json({ message: '申請編號有誤' });
    }

    const existing = await findByRequestId(requestId);
    if (!existing) {
      return res.status(404).json({ message: '找不到申請資料' });
    }

    if ((existing.status || '').toUpperCase() !== 'PENDING') {
      return res.status(409).json({ message: '此申請已完成審核' });
    }

    const incomingStatus = req.body?.status ? String(req.body.status).trim().toUpperCase() : '';
    if (!['APPROVED', 'REJECTED'].includes(incomingStatus)) {
      return res.status(400).json({ message: '狀態更新僅支援批准或駁回' });
    }

    let updated = await updateRequestById(requestId, {
      status: incomingStatus,
      determine_by_id: req.user.sub,
      determine_time: new Date(),
    });

    if (updated?.conflict_id) {
      const conflictSession = await findBySessionId(updated.conflict_id);
      if (conflictSession) {
        const conflictEvent = conflictSession.event_id
          ? await findByEventId(conflictSession.event_id)
          : null;
        updated = {
          ...updated,
          conflict_session_name: conflictSession.session_name || null,
          conflict_session_start: conflictSession.datetime_start || null,
          conflict_session_end: conflictSession.datetime_end || null,
          conflict_event_name: conflictEvent?.event_name || null,
        };
      }
    }

    return res.json({ message: '申請已更新', request: updated });
  } catch (error) {
    console.error('Update request failed:', error);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試' });
  }
});

module.exports = router;
