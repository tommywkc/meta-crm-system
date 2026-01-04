const crypto = require('crypto');

const {
  createUser,
  findLatestId,
  findUserByEmail,
  findUserByMobile,
} = require('../dao/usersDao');

const {
  checkIsConfirmedEnrolled,
  createEnrollment,
  findIfExist,
  updateStatusByEnrollmentId,
} = require('../dao/eventEnrollmentsDao');

const { findBySessionId, updateSessionById } = require('../dao/eventSessionsDao');
const {
  createRegistration,
  findBySessionAndUser,
} = require('../dao/sessionRegistrationsDao');

class ServiceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
  }
}

function normalizeEmail(email) {
  const v = String(email || '').trim();
  if (!v) return null;
  return v.toLowerCase();
}

function isValidEmail(email) {
  // Intentionally simple (avoid over-rejecting). Matches common emails.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function normalizeMobile8(mobile) {
  const digits = String(mobile || '').replace(/\D+/g, '');
  if (digits.length !== 8) {
    throw new ServiceError('INVALID_MOBILE', '電話號碼必須為 8 位數字。');
  }
  return digits;
}

function generateQrToken(mobile) {
  const timestamp = Date.now();
  const uniqueSource = `${mobile}-${timestamp}-${Math.random()}`;
  const hash = crypto.createHash('sha256').update(uniqueSource).digest('hex');
  return hash.substring(0, 24);
}

async function ensureUser({ name, mobile, email, source }) {
  const existing = await findUserByMobile(mobile);
  if (existing) {
    return { user: existing, created: false };
  }

  if (!name) {
    throw new ServiceError('INVALID_NAME', '缺少姓名。');
  }

  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail && !isValidEmail(normalizedEmail)) {
    throw new ServiceError('INVALID_EMAIL', '你輸入嘅 Email 格式唔正確。');
  }

  if (normalizedEmail) {
    const emailOwner = await findUserByEmail(normalizedEmail);
    if (emailOwner) {
      throw new ServiceError('EMAIL_IN_USE', '呢個 Email 已被使用，請更換另一個 Email（或留空）。');
    }
  }

  const latestId = parseInt(await findLatestId(), 10);
  const userId = (latestId || 49999) + 1;

  const createdUser = await createUser({
    user_id: userId,
    password: mobile,
    role: 'MEMBER',
    name,
    mobile,
    email: normalizedEmail,
    qr_token: generateQrToken(mobile),
    source: source || 'WhatsApp',
  });

  return { user: createdUser, created: true };
}

async function ensureConfirmedEnrollment({ userId, eventId, operatorUserId }) {
  const existing = await findIfExist(userId, eventId);

  if (!existing) {
    const created = await createEnrollment({
      event_id: eventId,
      user_id: userId,
      enroll_by_id: operatorUserId ?? null,
    });
    const confirmed = await updateStatusByEnrollmentId(created.enrollment_id, 'CONFIRMED');
    return { enrollment: confirmed || created, created: true };
  }

  const status = String(existing.status || '').toUpperCase();
  if (status !== 'CONFIRMED') {
    const confirmed = await updateStatusByEnrollmentId(existing.enrollment_id, 'CONFIRMED');
    return { enrollment: confirmed || existing, created: false, updated: true };
  }

  return { enrollment: existing, created: false };
}

async function registerFromWhatsApp({
  name,
  mobile,
  email = null,
  eventId,
  sessionId,
  operatorUserId,
  source = 'WhatsApp',
}) {
  const event_id = parseInt(eventId, 10);
  const session_id = parseInt(sessionId, 10);
  const enroll_by_id = operatorUserId == null ? null : parseInt(operatorUserId, 10);

  if (!Number.isFinite(event_id) || !Number.isFinite(session_id)) {
    throw new ServiceError('INVALID_TARGET', '無效的活動或場次。');
  }

  const normalizedMobile = normalizeMobile8(mobile);
  const normalizedName = String(name || '').trim();

  // 1) Ensure user exists
  const { user, created: userCreated } = await ensureUser({
    name: normalizedName,
    mobile: normalizedMobile,
    email,
    source,
  });

  // 2) Ensure enrollment confirmed
  const { enrollment } = await ensureConfirmedEnrollment({
    userId: user.user_id,
    eventId: event_id,
    operatorUserId: enroll_by_id,
  });

  // 3) Validate session belongs to event
  const session = await findBySessionId(session_id);
  if (!session) {
    throw new ServiceError('SESSION_NOT_FOUND', '找不到指定的場次。');
  }
  if (session.event_id == null || Number(session.event_id) !== Number(event_id)) {
    throw new ServiceError('SESSION_EVENT_MISMATCH', '場次不屬於此活動，無法報名。');
  }

  // 4) Ensure confirmed enrollment (double-check)
  const confirmed = await checkIsConfirmedEnrolled(user.user_id, event_id);
  if (!confirmed) {
    // Try to confirm anyway (covers edge cases)
    await ensureConfirmedEnrollment({
      userId: user.user_id,
      eventId: event_id,
      operatorUserId: enroll_by_id,
    });
  }

  // 5) Prevent duplicate registration
  const existingReg = await findBySessionAndUser(session_id, user.user_id);
  if (existingReg) {
    return {
      user,
      userCreated,
      enrollment,
      session,
      registration: existingReg,
      alreadyRegistered: true,
    };
  }

  // 6) Remaining seats check + decrement
  if (session.remaining_seats != null) {
    const remaining = Number(session.remaining_seats);
    if (Number.isFinite(remaining) && remaining <= 0) {
      throw new ServiceError('NO_SEATS', '此場次已無剩餘名額，無法報名。');
    }

    if (Number.isFinite(remaining)) {
      await updateSessionById(session_id, { remaining_seats: remaining - 1 });
    }
  }

  // 7) Create registration
  const registration = await createRegistration({
    session_id,
    user_id: user.user_id,
    channel: 'WHATSAPP',
    registration_by_id: enroll_by_id,
  });

  return {
    user,
    userCreated,
    enrollment,
    session,
    registration,
    alreadyRegistered: false,
  };
}

module.exports = {
  ServiceError,
  registerFromWhatsApp,
  normalizeEmail,
  isValidEmail,
  normalizeMobile8,
};
