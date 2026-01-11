const { findOpenFreeSeminars } = require('../../dao/eventsDao');
const { listByEventId } = require('../../dao/eventSessionsDao');
const {
  registerFromWhatsApp,
  ServiceError,
  normalizeEmail,
  isValidEmail,
} = require('../../services/seminarRegistrationService');

const { getState, setState } = require('./state');
const {
  formatDateTimeHK,
  formatDateTimeRangeHK,
  formatDateHK,
  formatRemainingOnly,
} = require('./formatters');
const templates = require('./templates');
const { sendText } = require('./sender');

function getWhatsAppOperatorUserId() {
  const v = process.env.WHATSAPP_OPERATOR_USER_ID;
  const n = parseInt(String(v || ''), 10);
  return Number.isFinite(n) ? n : null;
}

function parseProfileText(rawText) {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const out = { name: null, mobile: null, email: null };

  for (const line of lines) {
    const normalizedLine = line.replace(/：/g, ':');
    const idx = normalizedLine.indexOf(':');
    if (idx === -1) continue;

    const key = normalizedLine.slice(0, idx).trim();
    const value = normalizedLine.slice(idx + 1).trim();
    if (!value) continue;

    const normalizedKey = key
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[()（）]/g, '');

    if (key === '姓名' || key.toLowerCase() === 'name') {
      out.name = value;
      continue;
    }

    if (
      key === '電話號碼' ||
      key === '電話' ||
      normalizedKey === 'mobile' ||
      normalizedKey === 'phone'
    ) {
      out.mobile = value;
      continue;
    }

    if (normalizedKey === 'email' || normalizedKey.startsWith('email') || key === '電郵' || key === '電子郵件') {
      out.email = value;
      continue;
    }
  }

  if (out.mobile != null) {
    out.mobile = String(out.mobile).replace(/\D+/g, '');
  }

  if (out.email != null) {
    out.email = normalizeEmail(out.email);
  }

  return out;
}

async function sendFreeSeminarsMenu(to, valueMetadata) {
  const seminars = await findOpenFreeSeminars();

  const reply = templates.freeSeminarsMenu(seminars, {
    formatDateHK,
    formatRemainingOnly,
  });

  if (seminars && seminars.length > 0) {
    setState(to, { step: 'SEMINAR_MENU', seminars });
  } else {
    setState(to, { step: 'IDLE' });
  }

  await sendText(to, reply, valueMetadata);
}

function extractIncomingText(body) {
  const entry = Array.isArray(body?.entry) ? body.entry[0] : null;
  const change = Array.isArray(entry?.changes) ? entry.changes[0] : null;
  const value = change?.value;
  const message = Array.isArray(value?.messages) ? value.messages[0] : null;

  const from = message?.from;
  const textBody = message?.text?.body;
  const rawText = String(textBody ?? '').trim();

  return {
    from,
    rawText,
    normalized: rawText.toLowerCase(),
    normalizedNoSpace: rawText.replace(/\s+/g, ''),
    valueMetadata: value?.metadata,
  };
}

async function handleWhatsAppWebhookPayload(body) {
  const { from, rawText, normalized, normalizedNoSpace, valueMetadata } = extractIncomingText(body);
  if (!from) return;

  // Global: allow user to type "返回" to go back to the free seminar list
  if (
    normalizedNoSpace === '返回' ||
    normalizedNoSpace === '查看免費講座' ||
    normalizedNoSpace === '返回查看免費講座'
  ) {
    await sendFreeSeminarsMenu(from, valueMetadata);
    return;
  }

  // Step 1: user sends "查看免費講座" -> list open free seminars
  // (Handled in the global command block above)

  // Step 2: user replies a number -> show sessions for selected seminar
  if (/^\d+$/.test(normalized)) {
    const n = Number(normalized);
    if (!Number.isFinite(n) || n <= 0) return;

    const state = getState(from);

    // 2a) From seminar menu -> pick seminar -> show sessions
    if (state && state.step === 'SEMINAR_MENU' && Array.isArray(state.seminars)) {
      const idx = n - 1;
      const selected = state.seminars[idx];
      if (!selected) {
        void sendText(from, templates.invalidSeminarOption(), valueMetadata).catch(() => {});
        return;
      }

      const eventId = selected.event_id;
      const eventName = selected.event_name;
      const sessions = await listByEventId(eventId);

      const sorted = [...(sessions || [])].sort((a, b) => {
        const at = a?.datetime_start ? new Date(a.datetime_start).getTime() : Number.POSITIVE_INFINITY;
        const bt = b?.datetime_start ? new Date(b.datetime_start).getTime() : Number.POSITIVE_INFINITY;
        if (at !== bt) return at - bt;
        return (Number(a?.session_id) || 0) - (Number(b?.session_id) || 0);
      });

      let reply;
      if (!sorted || sorted.length === 0) {
        reply = templates.noSessions(eventName);
        setState(from, { step: 'SEMINAR_MENU', seminars: state.seminars });
      } else {
        reply = templates.sessionsMenu(eventName, sorted, {
          formatDateTimeRangeHK,
          formatRemainingOnly,
        });
        setState(from, { step: 'SESSION_MENU', seminar: selected, sessions: sorted });
      }

      await sendText(from, reply, valueMetadata);
      return;
    }

    // 2b) From session menu -> pick session -> ask for profile
    if (state && state.step === 'SESSION_MENU' && state.seminar && Array.isArray(state.sessions)) {
      const idx = n - 1;
      const selectedSession = state.sessions[idx];
      if (!selectedSession) {
        void sendText(from, templates.invalidSessionOption(), valueMetadata).catch(() => {});
        return;
      }

      const seminarName = String(state.seminar.event_name || '');
      const sessionName = String(selectedSession.session_name || '');
      const range = formatDateTimeRangeHK(selectedSession.datetime_start, selectedSession.datetime_end);

      setState(from, {
        step: 'WAIT_PROFILE',
        event_id: state.seminar.event_id,
        event_name: state.seminar.event_name,
        session_id: selectedSession.session_id,
        session_name: selectedSession.session_name,
        session_datetime_start: selectedSession.datetime_start,
        session_datetime_end: selectedSession.datetime_end,
      });

      const reply = templates.askProfile(seminarName, sessionName, range);
      const blankTemplate = templates.blankProfileTemplate();

      await sendText(from, reply, valueMetadata);
      await sendText(from, blankTemplate, valueMetadata);
      return;
    }

    void sendText(from, templates.askTestFirst(), valueMetadata).catch(() => {});
    return;
  }

  // Step 3: user provides profile data after picking a session
  const state = getState(from);
  if (state && state.step === 'WAIT_PROFILE') {
    const parsed = parseProfileText(rawText);

    const name = String(parsed.name || '').trim();
    const mobile = String(parsed.mobile || '').trim();
    const email = parsed.email;

    if (!name || !mobile) {
      await sendText(from, templates.missingRequiredProfile(), valueMetadata);
      return;
    }

    if (!/^\d{8}$/.test(mobile)) {
      await sendText(from, templates.invalidMobile(), valueMetadata);
      return;
    }

    if (email && !isValidEmail(email)) {
      await sendText(from, templates.invalidEmail(), valueMetadata);
      return;
    }

    const operatorUserId = getWhatsAppOperatorUserId();

    let result;
    try {
      result = await registerFromWhatsApp({
        name,
        mobile,
        email,
        eventId: state.event_id,
        sessionId: state.session_id,
        operatorUserId,
        source: 'WhatsApp',
      });
    } catch (e) {
      if (e instanceof ServiceError) {
        await sendText(from, e.message || '資料有誤，請重新輸入。', valueMetadata);
        return;
      }
      throw e;
    }

    const eventName = String(state.event_name || '');
    const sessionName = String(state.session_name || '');
    const start = formatDateTimeHK(state.session_datetime_start);

    const crmUrl =
      process.env.CRM_PORTAL_URL ||
      'https://meta-academy-crm-frontend-hvbgdedec7hfayaa.switzerlandnorth-01.azurewebsites.net/';

    const extra = result.alreadyRegistered
      ? '\n（你之前已報名此場次，系統已略過重複報名。）'
      : '';

    const reply = result.userCreated
      ? (
          `已為你建立新帳號並完成報名！\n` +
          `${eventName}\n` +
          `${sessionName} ${start}${extra}\n\n` +
          `登入帳戶: ${result.user?.user_id}\n` +
          `密碼: ${mobile}\n\n` +
          `CRM: ${crmUrl}\n\n` +
          `${templates.BACK_HINT}`
        )
      : (
          `已使用你現有帳號並完成報名！\n` +
          `${eventName}\n` +
          `${sessionName} ${start}${extra}\n\n` +
          `可登入CRM查看:\n` +
          `${crmUrl}\n\n` +
          `${templates.BACK_HINT}`
        );

    await sendText(from, reply, valueMetadata);

    setState(from, { step: 'IDLE' });
    return;
  }

  // default fallback
  void sendText(from, templates.askTestFirst(), valueMetadata).catch(() => {});
}

module.exports = {
  handleWhatsAppWebhookPayload,
};
