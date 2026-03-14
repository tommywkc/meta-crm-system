const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  createRequest,
  findPendingByUserAndSession,
  listAllRequests,
  listRequestsByUser,
  listByUserId,
  findByRequestId,
  findRequestDetailById,
  updateRequestById,
} = require('../dao/requestsDao');
const { findBySessionAndUser, listSessionsByUserWithTimes, removeByRegistrationId, createRegistration, updateRegistrationById } = require('../dao/sessionRegistrationsDao');
const { findBySessionId, updateSessionById, listByEventId } = require('../dao/eventSessionsDao');
const { findByEventId } = require('../dao/eventsDao');
const { listHolidays } = require('../dao/holidaysDao');
const { createSuspension, findLatestSuspensionByUserId, updateSuspensionById } = require('../dao/suspensionDao');
const { updateByUserId } = require('../dao/usersDao');
const { buildHolidaySet, countBusinessDays } = require('../utils/businessDays');
const waitlistDao = require('../dao/waitlistDao');

const isActiveRegistration = (reg) => {
  if (!reg) return false;
  return String(reg.status || '').toUpperCase() === 'REGISTERED';
};

const isRegisteredOrCancelled = (reg) => {
  if (!reg) return false;
  const status = String(reg.status || '').toUpperCase();
  return status === 'REGISTERED' || status === 'CANCELLED';
};

const isCancelledRegistration = (reg) => {
  if (!reg) return false;
  return String(reg.status || '').toUpperCase() === 'CANCELLED';
};

const getWaitlistPriority = (requestType, priorityTier = null) => {
  const type = (requestType || '').toUpperCase();
  if (type === 'MAKEUP') return 1;
  if (type === 'RETAKE') {
    if (priorityTier === 3) return 3;
    return 2;
  }
  return null;
};

const computeRetakePriorityTier = async (userId, targetSessionId, excludeRequestId = null) => {
  if (!userId || !targetSessionId) return null;
  const targetSession = await findBySessionId(targetSessionId);
  if (!targetSession?.event_id || !targetSession?.session_name) return null;

  const userRequests = await listByUserId(userId);
  let retakeCount = 0;

  for (const req of userRequests || []) {
    if ((req?.request_type || '').toUpperCase() !== 'RETAKE') continue;
    const status = (req?.status || '').toUpperCase();
    if (status !== 'APPROVED') continue;
    if (excludeRequestId != null && String(req.request_id) === String(excludeRequestId)) continue;
    if (!req?.new_session_id) continue;

    const session = await findBySessionId(req.new_session_id);
    if (session?.event_id === targetSession.event_id && session?.session_name === targetSession.session_name) {
      retakeCount += 1;
    }
  }

  if (retakeCount <= 0) return 2;
  return 3;
};

const ensurePriorityTier = async (req) => {
  if (!req) return req;
  const typeKey = (req.request_type || '').toUpperCase();
  if (typeKey !== 'MAKEUP' && typeKey !== 'RETAKE') return req;
  if (req.priority_tier != null) return req;

  let priority_tier = null;
  if (typeKey === 'MAKEUP') {
    priority_tier = 1;
  } else if (typeKey === 'RETAKE' && req.new_session_id) {
    priority_tier = await computeRetakePriorityTier(req.user_id, req.new_session_id, req.request_id);
  }

  if (priority_tier == null) return req;

  const updated = await updateRequestById(req.request_id, { priority_tier });
  return updated ? { ...req, priority_tier: updated.priority_tier } : { ...req, priority_tier };
};

const updatePendingRetakePriorities = async (userId, targetSessionId, excludeRequestId = null) => {
  if (!userId || !targetSessionId) return;
  const targetSession = await findBySessionId(targetSessionId);
  if (!targetSession?.event_id || !targetSession?.session_name) return;

  const userRequests = await listByUserId(userId);
  for (const req of userRequests || []) {
    if ((req?.request_type || '').toUpperCase() !== 'RETAKE') continue;
    const status = (req?.status || '').toUpperCase();
    if (status !== 'PENDING') continue;
    if (excludeRequestId != null && String(req.request_id) === String(excludeRequestId)) continue;
    if (!req?.new_session_id) continue;

    const session = await findBySessionId(req.new_session_id);
    if (session?.event_id === targetSession.event_id && session?.session_name === targetSession.session_name) {
      await updateRequestById(req.request_id, { priority_tier: 3 });
    }
  }
};

const recalcPendingRequestConflicts = async (userId, excludeRequestId = null) => {
  if (!userId) return;
  const requests = await listByUserId(userId);
  const pending = (requests || []).filter((req) => {
    const isPending = (req?.status || '').toUpperCase() === 'PENDING';
    const isExcluded = excludeRequestId != null && String(req.request_id) === String(excludeRequestId);
    return isPending && !isExcluded;
  });

  if (pending.length === 0) return;

  const sessions = await listSessionsByUserWithTimes(userId);

  for (const req of pending) {
    if (!req?.new_session_id) {
      await updateRequestById(req.request_id, { time_conflict: null, conflict_id: null });
      continue;
    }

    const targetSession = await findBySessionId(req.new_session_id);
    if (!targetSession?.datetime_start) {
      await updateRequestById(req.request_id, { time_conflict: null, conflict_id: null });
      continue;
    }

    const targetStart = new Date(targetSession.datetime_start);
    const targetEnd = targetSession.datetime_end
      ? new Date(targetSession.datetime_end)
      : new Date(targetSession.datetime_start);

    let time_conflict = false;
    let conflict_id = null;

    for (const other of sessions) {
      if (!other?.session_id || !other?.datetime_start) continue;
      if (String(other.session_id) === String(req.new_session_id)) continue;
      if (req.old_session_id && String(other.session_id) === String(req.old_session_id)) continue;

      const otherStart = new Date(other.datetime_start);
      const otherEnd = other.datetime_end ? new Date(other.datetime_end) : new Date(other.datetime_start);

      if (targetStart < otherEnd && targetEnd > otherStart) {
        time_conflict = true;
        conflict_id = other.session_id;
        break;
      }
    }

    await updateRequestById(req.request_id, { time_conflict, conflict_id });
  }
};

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


const attachConflictDetails = async (requests = []) => {
  if (!Array.isArray(requests) || requests.length === 0) return requests;

  const enriched = await Promise.all(requests.map(async (req) => {
    const withPriority = await ensurePriorityTier(req);
    const sourceReq = withPriority || req;
    if (!sourceReq?.conflict_id) return sourceReq;
    const conflictSession = await findBySessionId(sourceReq.conflict_id);
    if (!conflictSession) return sourceReq;
    const conflictEvent = conflictSession.event_id
      ? await findByEventId(conflictSession.event_id)
      : null;
    return {
      ...sourceReq,
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
      if (isActiveRegistration(existingTarget)) {
        return res.status(400).json({ message: '此會員已報名目標場次，無法提交補堂／覆課申請' });
      }
    }

    const requiresPriorSameName = (normalizedType === 'MAKEUP' || normalizedType === 'RETAKE') && targetSessionIdNum;
    if (requiresPriorSameName) {
      const targetSession = await findBySessionId(targetSessionIdNum);
      if (targetSession?.event_id && targetSession?.session_name) {
        const sameEventSessions = await listByEventId(targetSession.event_id);
        let hasSameNameRegistration = false;
        let hasCancelledSameName = false;
        for (const session of sameEventSessions || []) {
          if (!session?.session_id) continue;
          if (session.session_name !== targetSession.session_name) continue;
          const existingReg = await findBySessionAndUser(session.session_id, memberIdNum);
          if (isCancelledRegistration(existingReg)) {
            hasCancelledSameName = true;
          }
          if (isRegisteredOrCancelled(existingReg)) {
            hasSameNameRegistration = true;
            break;
          }
        }

        if (normalizedType === 'RETAKE' && hasCancelledSameName) {
          return res.status(400).json({ message: '客戶未有其他場次的確認紀錄，請改用補堂申請' });
        }

        if (!hasSameNameRegistration) {
          return res.status(400).json({ message: '此會員尚未報名同活動其他場次，可以直接在活動頁報名' });
        }
      }
    }

    if (normalizedType === 'MAKEUP' && targetSessionIdNum) {
      const targetSession = await findBySessionId(targetSessionIdNum);
      if (targetSession?.event_id && targetSession?.session_name) {
        const sameEventSessions = await listByEventId(targetSession.event_id);
        let existingSameName = null;
        for (const session of sameEventSessions || []) {
          if (!session?.session_id) continue;
          if (String(session.session_id) === String(targetSessionIdNum)) continue;
          if (session.session_name !== targetSession.session_name) continue;
          const reg = await findBySessionAndUser(session.session_id, memberIdNum);
          if (isActiveRegistration(reg)) {
            existingSameName = session.session_id;
            break;
          }
        }

        if (existingSameName) {
          return res.status(400).json({ message: '此會員已報名目標活動其他場次，無法提交補堂申請，請選擇覆課申請' });
        }

        const userRequests = await listByUserId(memberIdNum);
        const hasPendingMakeup = (userRequests || []).some((req) => {
          if ((req?.status || '').toUpperCase() !== 'PENDING') return false;
          if ((req?.request_type || '').toUpperCase() !== 'MAKEUP') return false;
          if (!req?.new_session_id) return false;
          return String(req.new_session_id) !== String(targetSessionIdNum);
        });

        if (hasPendingMakeup) {
          for (const req of userRequests || []) {
            if ((req?.status || '').toUpperCase() !== 'PENDING') continue;
            if ((req?.request_type || '').toUpperCase() !== 'MAKEUP') continue;
            if (!req?.new_session_id || String(req.new_session_id) === String(targetSessionIdNum)) continue;
            const session = await findBySessionId(req.new_session_id);
            if (session?.event_id === targetSession.event_id && session?.session_name === targetSession.session_name) {
              return res.status(400).json({ message: '此會員已有目標活動其他場次的補堂申請，無法再提交其他場次' });
            }
          }
        }
      }
    }

    const remarksInput = typeof reason === 'string' ? reason.trim() : '';
    const remarks = remarksInput ? remarksInput.slice(0, 255) : null;

    let priority_tier = null;
    if (normalizedType === 'MAKEUP') {
      priority_tier = 1;
    } else if (normalizedType === 'RETAKE' && targetSessionIdNum) {
      priority_tier = await computeRetakePriorityTier(memberIdNum, targetSessionIdNum);
    }

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
      priority_tier,
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

router.get('/requests/:requestId', authMiddleware, roleMiddleware(['admin', 'sales', 'leader', 'member']), async (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId, 10);
    if (Number.isNaN(requestId)) {
      return res.status(400).json({ message: '申請編號有誤' });
    }

    const requesterRole = (req.user.role || '').toUpperCase();
    const request = await findRequestDetailById(requestId);
    if (!request) {
      return res.status(404).json({ message: '找不到申請資料' });
    }

    if (requesterRole === 'MEMBER' && String(request.user_id) !== String(req.user.sub)) {
      return res.status(403).json({ message: '沒有權限檢視此申請' });
    }

    const enriched = await attachConflictDetails([request]);
    return res.json({ request: enriched[0] || request });
  } catch (error) {
    console.error('Get request detail failed:', error);
    return res.status(500).json({ message: '無法載入申請詳情' });
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
    const rejectReason = req.body?.reject_reason ? String(req.body.reject_reason).trim() : '';
    if (!['APPROVED', 'REJECTED'].includes(incomingStatus)) {
      return res.status(400).json({ message: '狀態更新僅支援批准或駁回' });
    }

    let updated = await updateRequestById(requestId, {
      status: incomingStatus,
      determine_by_id: req.user.sub,
      determine_time: new Date(),
      reject_reason: incomingStatus === 'REJECTED' ? (rejectReason || null) : null,
    });

    if (incomingStatus === 'APPROVED' && (existing.request_type || '').toUpperCase() === 'LEAVE') {
      const leaveSessionId = existing.old_session_id;
      const leaveUserId = existing.user_id;
      let registrationId = existing.registration_id || null;

      if (!registrationId && leaveSessionId && leaveUserId) {
        const reg = await findBySessionAndUser(leaveSessionId, leaveUserId);
        registrationId = reg?.registration_id || null;
      }

      if (registrationId) {
        await updateRegistrationById(registrationId, { status: 'CANCELLED' });

        if (leaveSessionId) {
          const leaveSession = await findBySessionId(leaveSessionId);
          const currentRemaining = leaveSession?.remaining_seats != null ? Number(leaveSession.remaining_seats) : null;
          if (currentRemaining != null && !Number.isNaN(currentRemaining)) {
            await updateSessionById(leaveSessionId, { remaining_seats: currentRemaining + 1 });
          }

          const waitlistRow = await waitlistDao.findBySessionId(leaveSessionId);
          const list = waitlistDao.parseWaitlist ? waitlistDao.parseWaitlist(waitlistRow?.waitlist) : [];

          if (Array.isArray(list) && list.length > 0) {
            const nextUserId = parseInt(list[0]?.user_id ?? list[0], 10);
            if (!Number.isNaN(nextUserId)) {
              const existingRegistration = await findBySessionAndUser(leaveSessionId, nextUserId);
              if (!existingRegistration) {
                await createRegistration({
                  session_id: leaveSessionId,
                  user_id: nextUserId,
                  channel: 'WEB',
                  registration_by_id: req.user?.sub || null,
                });
                if (currentRemaining != null && !Number.isNaN(currentRemaining)) {
                  await updateSessionById(leaveSessionId, { remaining_seats: Math.max(0, currentRemaining) });
                }
              }
            }

            const remainingList = list.slice(1);
            await waitlistDao.updateBySessionId(leaveSessionId, JSON.stringify(remainingList));
          }
        }
      }

      if (leaveSessionId) {
        const leaveSession = await findBySessionId(leaveSessionId);
        if (leaveSession?.event_id) {
          const event = await findByEventId(leaveSession.event_id);
          if (event?.type === 'CLASS' && leaveSession?.datetime_start) {
            const holidays = await listHolidays(5000, 0);
            const holidaySet = buildHolidaySet(holidays);
            const businessDays = countBusinessDays(new Date(), new Date(leaveSession.datetime_start), holidaySet);

            if (businessDays < 3) {
              const startTime = existing.request_time ? new Date(existing.request_time) : new Date();
              const endTime = new Date(startTime);
              endTime.setMonth(endTime.getMonth() + 2);
              endTime.setHours(23, 59, 0, 0);
              const reason = `請假申請（低於 3 個工作天）: request_id ${existing.request_id}`;
              const latest = await findLatestSuspensionByUserId(leaveUserId);
              const now = new Date();
              if (latest && (!latest.end_time || new Date(latest.end_time) >= now)) {
                const latestEnd = latest.end_time ? new Date(latest.end_time) : null;
                const nextEnd = latestEnd && latestEnd > endTime ? latestEnd : endTime;
                await updateSuspensionById(latest.suspension_id, {
                  end_time: nextEnd,
                  reason,
                });
              } else {
                await createSuspension({
                  user_id: leaveUserId,
                  reason,
                  start_time: startTime,
                  end_time: endTime,
                  created_by: req.user.sub,
                });
              }
              await updateByUserId(leaveUserId, { suspension: true });
            }
          }
        }
      }
    }

    if (incomingStatus === 'APPROVED' && (existing.request_type || '').toUpperCase() === 'RESCHEDULE') {
      const oldSessionId = existing.old_session_id;
      const newSessionId = existing.new_session_id;
      const userId = existing.user_id;
      let registrationId = existing.registration_id || null;

      if (!registrationId && oldSessionId && userId) {
        const reg = await findBySessionAndUser(oldSessionId, userId);
        registrationId = reg?.registration_id || null;
      }

      if (registrationId) {
        await updateRegistrationById(registrationId, { status: 'CANCELLED' });

        if (oldSessionId) {
          const oldSession = await findBySessionId(oldSessionId);
          const currentRemaining = oldSession?.remaining_seats != null ? Number(oldSession.remaining_seats) : null;
          if (currentRemaining != null && !Number.isNaN(currentRemaining)) {
            await updateSessionById(oldSessionId, { remaining_seats: currentRemaining + 1 });
          }

          const waitlistRow = await waitlistDao.findBySessionId(oldSessionId);
          const list = waitlistDao.parseWaitlist ? waitlistDao.parseWaitlist(waitlistRow?.waitlist) : [];

          if (Array.isArray(list) && list.length > 0) {
            const nextUserId = parseInt(list[0]?.user_id ?? list[0], 10);
            if (!Number.isNaN(nextUserId)) {
              const existingRegistration = await findBySessionAndUser(oldSessionId, nextUserId);
              if (!existingRegistration) {
                await createRegistration({
                  session_id: oldSessionId,
                  user_id: nextUserId,
                  channel: 'WEB',
                  registration_by_id: req.user?.sub || null,
                });
                if (currentRemaining != null && !Number.isNaN(currentRemaining)) {
                  await updateSessionById(oldSessionId, { remaining_seats: Math.max(0, currentRemaining) });
                }
              }
            }

            const remainingList = list.slice(1);
            await waitlistDao.updateBySessionId(oldSessionId, JSON.stringify(remainingList));
          }
        }
      }

      if (newSessionId && userId) {
        const targetSession = await findBySessionId(newSessionId);
        if (targetSession) {
          const remainingSeats = targetSession.remaining_seats != null ? Number(targetSession.remaining_seats) : null;
          if (remainingSeats != null && !Number.isNaN(remainingSeats)) {
            if (remainingSeats <= 0) {
              await waitlistDao.appendUserToWaitlist(newSessionId, userId, null);
            } else {
              await createRegistration({
                session_id: newSessionId,
                user_id: userId,
                channel: 'WEB',
                registration_by_id: req.user?.sub || null,
              });
              await updateSessionById(newSessionId, { remaining_seats: remainingSeats - 1 });
            }
          } else {
            await createRegistration({
              session_id: newSessionId,
              user_id: userId,
              channel: 'WEB',
              registration_by_id: req.user?.sub || null,
            });
          }
        }
      }
    }

    if (incomingStatus === 'APPROVED' && (((existing.request_type || '').toUpperCase() === 'MAKEUP') || (existing.request_type || '').toUpperCase() === 'RETAKE')) {
      const newSessionId = existing.new_session_id;
      const userId = existing.user_id;

      if (newSessionId && userId) {
        const alreadyRegistered = await findBySessionAndUser(newSessionId, userId);
        if (!alreadyRegistered) {
          const targetSession = await findBySessionId(newSessionId);
          if (targetSession) {
            const remainingSeats = targetSession.remaining_seats != null ? Number(targetSession.remaining_seats) : null;
            if (remainingSeats != null && !Number.isNaN(remainingSeats)) {
              if (remainingSeats <= 0) {
                await waitlistDao.appendUserToWaitlist(
                  newSessionId,
                  userId,
                  getWaitlistPriority(existing.request_type, existing.priority_tier)
                );
              } else {
                await createRegistration({
                  session_id: newSessionId,
                  user_id: userId,
                  channel: 'WEB',
                  registration_by_id: req.user?.sub || null,
                });
                await updateSessionById(newSessionId, { remaining_seats: remainingSeats - 1 });
              }
            } else {
              await createRegistration({
                session_id: newSessionId,
                user_id: userId,
                channel: 'WEB',
                registration_by_id: req.user?.sub || null,
              });
            }
          }
        }
      }
    }

    if (incomingStatus === 'APPROVED' && (existing.request_type || '').toUpperCase() === 'RETAKE') {
      await updatePendingRetakePriorities(existing.user_id, existing.new_session_id, requestId);
    }

    

    if (incomingStatus === 'APPROVED') {
      await recalcPendingRequestConflicts(existing.user_id, requestId);
    }

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

router.put('/requests/:requestId/cancel', authMiddleware, roleMiddleware(['admin', 'sales', 'leader', 'member']), async (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId, 10);
    if (Number.isNaN(requestId)) {
      return res.status(400).json({ message: '申請編號有誤' });
    }

    const existing = await findByRequestId(requestId);
    if (!existing) {
      return res.status(404).json({ message: '找不到申請資料' });
    }

    const requesterRole = (req.user.role || '').toUpperCase();
    if (requesterRole === 'MEMBER' && String(existing.user_id) !== String(req.user.sub)) {
      return res.status(403).json({ message: '沒有權限取消此申請' });
    }

    if ((existing.status || '').toUpperCase() !== 'PENDING') {
      return res.status(409).json({ message: '僅可取消待審核申請' });
    }

    let updated = await updateRequestById(requestId, {
      status: 'CANCELLED',
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

    return res.json({ message: '申請已取消', request: updated });
  } catch (error) {
    console.error('Cancel request failed:', error);
    return res.status(500).json({ message: '伺服器錯誤，請稍後再試' });
  }
});

module.exports = router;
