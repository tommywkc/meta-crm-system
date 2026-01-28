const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { createRequest, findPendingByUserAndSession, listAllRequests, listRequestsByUser } = require('../dao/requestsDao');
const { findBySessionAndUser } = require('../dao/sessionRegistrationsDao');

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

    const request = await createRequest({
      request_type: normalizedType,
      registration_id: registrationId,
      user_id: memberIdNum,
      old_session_id: duplicateOldSessionId,
      new_session_id: duplicateNewSessionId,
      request_by_id: req.user.sub,
      status: 'PENDING',
      remarks,
    });

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
      return res.json({ requests });
    }

    const requests = await listAllRequests();
    return res.json({ requests });
  } catch (error) {
    console.error('List requests failed:', error);
    return res.status(500).json({ message: '無法載入申請列表' });
  }
});

module.exports = router;
