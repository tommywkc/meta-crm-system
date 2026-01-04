const express = require('express');
const crypto = require('crypto');

const { sendWhatsAppText } = require('../services/whatsappService');
const { findOpenFreeSeminars } = require('../dao/eventsDao');
const { listByEventId } = require('../dao/eventSessionsDao');
const {
  registerFromWhatsApp,
  ServiceError,
  normalizeEmail,
  isValidEmail,
} = require('../services/seminarRegistrationService');

// In-memory conversation state (per phone number). This resets on server restart.
// Kept minimal for now.
const conversationState = new Map();
const CONVERSATION_TTL_MS = 15 * 60 * 1000;

function getState(from) {
  const key = String(from || '').trim();
  if (!key) return null;
  const state = conversationState.get(key);
  if (!state) return null;
  if (Date.now() - state.ts > CONVERSATION_TTL_MS) {
    conversationState.delete(key);
    return null;
  }
  return state;
}

function setState(from, state) {
  const key = String(from || '').trim();
  if (!key) return;
  conversationState.set(key, { ...state, ts: Date.now() });
}

const router = express.Router();

function getVerifyToken() {
  return (
    process.env.WHATSAPP_VERIFY_TOKEN ||
    ''
  );
}

function timingSafeEqualString(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

// Optional: verify Meta webhook signature if META_APP_SECRET is set.
// Signature header: X-Hub-Signature-256: sha256=<hmac>
function verifyMetaSignature(req) {
  const appSecret = process.env.META_APP_SECRET || '';
  if (!appSecret) return true;

  const signatureHeader = req.get('X-Hub-Signature-256') || '';
  const rawBody = req.rawBody;
  if (!rawBody || !signatureHeader.startsWith('sha256=')) return false;

  const expected =
    'sha256=' +
    crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

  return timingSafeEqualString(signatureHeader, expected);
}

function formatDateTimeHK(value) {
  if (!value) return '未定';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(d);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}`;
}

function formatTimeHK(value) {
  if (!value) return '未定';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(d);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.hour}:${map.minute}`;
}

function formatDateTimeRangeHK(startValue, endValue) {
  if (!startValue) return '未定';
  if (!endValue) return formatDateTimeHK(startValue);

  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${formatDateTimeHK(startValue)}至${formatDateTimeHK(endValue)}`;
  }

  const startDate = formatDateHK(startValue);
  const endDate = formatDateHK(endValue);
  const startTime = formatTimeHK(startValue);
  const endTime = formatTimeHK(endValue);

  if (startDate === endDate) return `${startDate} ${startTime}-${endTime}`;
  return `${startDate} ${startTime}至${endDate} ${endTime}`;
}

function formatDateHK(value) {
  if (!value) return '未定';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function formatRemainingSeats(remaining, capacity) {
  const r = remaining == null ? null : Number(remaining);
  const c = capacity == null ? null : Number(capacity);
  if (Number.isFinite(r) && Number.isFinite(c)) return `${r}/${c}`;
  if (Number.isFinite(r)) return `${r}`;
  return '未知';
}

function formatRemainingOnly(remaining) {
  const r = remaining == null ? null : Number(remaining);
  if (Number.isFinite(r)) return `${r}`;
  return '未知';
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

    if (key === '姓名' || key.toLowerCase() === 'name') {
      out.name = value;
      continue;
    }

    if (key === '電話號碼' || key === '電話' || key.toLowerCase() === 'mobile' || key.toLowerCase() === 'phone') {
      out.mobile = value;
      continue;
    }

    if (key.toLowerCase() === 'email' || key === '電郵' || key === '電子郵件') {
      out.email = value;
      continue;
    }
  }

  // Normalize mobile to digits only (expect 8 digits)
  if (out.mobile != null) {
    out.mobile = String(out.mobile).replace(/\D+/g, '');
  }

  // Normalize email (optional)
  if (out.email != null) {
    out.email = normalizeEmail(out.email);
  }

  return out;
}

function getWhatsAppOperatorUserId() {
  const v = process.env.WHATSAPP_OPERATOR_USER_ID;
  const n = parseInt(String(v || ''), 10);
  return Number.isFinite(n) ? n : null;
}

async function sendFreeSeminarsMenu({ to, valueMetadata }) {
  const seminars = await findOpenFreeSeminars();

  let reply;
  if (!seminars || seminars.length === 0) {
    reply = '目前沒有開放中的免費講座。';
  } else {
    const lines = ['以下是目前免費的講座'];
    seminars.forEach((s, idx) => {
      const start = formatDateHK(s.datetime_start);
      const end = s.datetime_end ? formatDateHK(s.datetime_end) : null;
      const dateRange = end ? `${start}至${end}` : `${start}`;
      const remaining = formatRemainingOnly(s.remaining_seats);
      lines.push(`${idx + 1}. ${s.event_name}（${dateRange} 餘下位置 ${remaining}）`);
      if (idx !== seminars.length - 1) lines.push('');
    });
    lines.push('如有興趣，請輸入相應的數字（例如：輸入 1）');
    reply = lines.join('\n');
  }

  if (seminars && seminars.length > 0) {
    setState(to, { step: 'SEMINAR_MENU', seminars });
  } else {
    setState(to, { step: 'IDLE' });
  }

  await sendWhatsAppText({
    to: String(to),
    body: reply,
    valueMetadata,
  });
}

// GET /webhook/whatsapp
// Verification: ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token && String(token) === getVerifyToken()) {
    return res.status(200).send(String(challenge ?? ''));
  }

  return res.sendStatus(403);
});

// POST /webhook/whatsapp
router.post('/whatsapp', (req, res) => {
  if (!verifyMetaSignature(req)) {
    return res.sendStatus(401);
  }

  // Keep it minimal: acknowledge quickly.
  // Log only high-level info to avoid storing PII in logs.
  const body = req.body;
  const hasEntry = Array.isArray(body?.entry) && body.entry.length > 0;
  console.log(
    `WhatsApp webhook received: hasEntry=${hasEntry} object=${body?.object || ''}`
  );

  // Fire-and-forget reply: user sends "test" -> reply "123".
  try {
    const entry = Array.isArray(body?.entry) ? body.entry[0] : null;
    const change = Array.isArray(entry?.changes) ? entry.changes[0] : null;
    const value = change?.value;
    const message = Array.isArray(value?.messages) ? value.messages[0] : null;

    const from = message?.from;
    const textBody = message?.text?.body;
    const rawText = String(textBody ?? '').trim();
    const normalized = rawText.toLowerCase();
    const normalizedNoSpace = rawText.replace(/\s+/g, '');

    if (!from) {
      return res.sendStatus(200);
    }

    // Global: allow user to type "返回" to go back to the free seminar list
    if (
      normalizedNoSpace === '返回' ||
      normalizedNoSpace === '查看免費講座' ||
      normalizedNoSpace === '返回查看免費講座'
    ) {
      void sendFreeSeminarsMenu({ to: from, valueMetadata: value?.metadata }).catch((e) => {
        console.error('WhatsApp back-to-menu failed:', e?.message || e);
      });

      return res.sendStatus(200);
    }

    // Step 1: user sends "test" -> list open free seminars
    if (normalized === 'test') {
      void sendFreeSeminarsMenu({ to: from, valueMetadata: value?.metadata }).catch((e) => {
        console.error('WhatsApp auto-reply failed:', e?.message || e);
      });
      return res.sendStatus(200);
    }

    // Step 2: user replies a number -> show sessions for selected seminar
    if (/^\d+$/.test(normalized)) {
      const n = Number(normalized);
      if (!Number.isFinite(n) || n <= 0) {
        return res.sendStatus(200);
      }

      const state = getState(from);

      // 2a) From seminar menu -> pick seminar -> show sessions
      if (state && state.step === 'SEMINAR_MENU' && Array.isArray(state.seminars)) {
        const idx = n - 1;
        const selected = state.seminars[idx];
        if (!selected) {
          void sendWhatsAppText({
            to: String(from),
            body: '無效的選項，請輸入清單內的數字。',
            valueMetadata: value?.metadata
          }).catch(() => {});
          return res.sendStatus(200);
        }

        void (async () => {
          const eventId = selected.event_id;
          const eventName = selected.event_name;
          const sessions = await listByEventId(eventId);

          // Sort sessions by datetime_start asc (fallback to session_id)
          const sorted = [...(sessions || [])].sort((a, b) => {
            const at = a?.datetime_start ? new Date(a.datetime_start).getTime() : Number.POSITIVE_INFINITY;
            const bt = b?.datetime_start ? new Date(b.datetime_start).getTime() : Number.POSITIVE_INFINITY;
            if (at !== bt) return at - bt;
            return (Number(a?.session_id) || 0) - (Number(b?.session_id) || 0);
          });

          let reply;
          if (!sorted || sorted.length === 0) {
            reply = `「${eventName}」目前未有場次。\n如需返回查看免費講座，請輸入：返回`;
            setState(from, { step: 'SEMINAR_MENU', seminars: state.seminars });
          } else {
            const lines = [`以下是${eventName}的場次`];
            sorted.forEach((s, i) => {
              const range = formatDateTimeRangeHK(s.datetime_start, s.datetime_end);
              const remaining = formatRemainingOnly(s.remaining_seats);
              lines.push(`${i + 1}. ${s.session_name}(${range} 餘下位置 ${remaining})`);
            });
            lines.push('請輸入相應的場次數字(例如：輸入 2)');
            lines.push('如需返回查看免費講座，請輸入：返回');
            reply = lines.join('\n');
            setState(from, { step: 'SESSION_MENU', seminar: selected, sessions: sorted });
          }

          await sendWhatsAppText({
            to: String(from),
            body: reply,
            valueMetadata: value?.metadata
          });
        })().catch((e) => {
          console.error('WhatsApp session list failed:', e?.message || e);
        });

        return res.sendStatus(200);
      }

      // 2b) From session menu -> pick session -> ask for profile
      if (state && state.step === 'SESSION_MENU' && state.seminar && Array.isArray(state.sessions)) {
        const idx = n - 1;
        const selectedSession = state.sessions[idx];
        if (!selectedSession) {
          void sendWhatsAppText({
            to: String(from),
            body: '無效的選項，請輸入清單內的場次數字。',
            valueMetadata: value?.metadata
          }).catch(() => {});
          return res.sendStatus(200);
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

        const reply =
          `收到，你已選擇：\n` +
          `${seminarName}\n` +
          `${sessionName} ${range}\n\n` +
          `請根據以下格式輸入個人資料\n` +
          `(例子)\n` +
          `姓名: 王小明\n` +
          `電話號碼: 23456789\n` +
          `Email(選填): abcd@yahoo.com.hk`;

        const blankTemplate =
          `姓名: \n` +
          `電話號碼: \n` +
          `Email(選填): `;

        void (async () => {
          await sendWhatsAppText({
            to: String(from),
            body: reply,
            valueMetadata: value?.metadata
          });
          await sendWhatsAppText({
            to: String(from),
            body: blankTemplate,
            valueMetadata: value?.metadata
          });
        })().catch(() => {});

        return res.sendStatus(200);
      }

      // otherwise
      void sendWhatsAppText({
        to: String(from),
        body: '請先輸入 Test 取得講座清單。',
        valueMetadata: value?.metadata
      }).catch(() => {});
      return res.sendStatus(200);
    }

    // Step 3: user provides profile data after picking a session
    {
      const state = getState(from);
      if (state && state.step === 'WAIT_PROFILE') {
        void (async () => {
          const parsed = parseProfileText(rawText);

          const name = String(parsed.name || '').trim();
          const mobile = String(parsed.mobile || '').trim();
          const email = parsed.email;

          if (!name || !mobile) {
            await sendWhatsAppText({
              to: String(from),
              body:
                '缺少必要資料（姓名、電話號碼）。\n請按以下格式重新輸入：\n' +
                '姓名: 王小明\n' +
                '電話號碼: 23456789\n' +
                'Email(選填): abcd@yahoo.com.hk',
              valueMetadata: value?.metadata
            });
            return;
          }

          if (!/^\d{8}$/.test(mobile)) {
            await sendWhatsAppText({
              to: String(from),
              body: '電話號碼必須為 8 位數字，請重新輸入。',
              valueMetadata: value?.metadata
            });
            return;
          }

          if (email && !isValidEmail(email)) {
            await sendWhatsAppText({
              to: String(from),
              body: '你輸入嘅 Email 格式唔正確，請重新輸入 Email（或留空 Email）。',
              valueMetadata: value?.metadata
            });
            return;
          }

          const operatorUserId = getWhatsAppOperatorUserId();
          // operatorUserId is optional; if missing, enroll_by_id / registration_by_id will be NULL

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
              await sendWhatsAppText({
                to: String(from),
                body: e.message || '資料有誤，請重新輸入。',
                valueMetadata: value?.metadata
              });
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

          const extra = result.alreadyRegistered ? '\n（你之前已報名此場次，系統已略過重複報名。）' : '';

          await sendWhatsAppText({
            to: String(from),
            body: result.userCreated
              ? (
                  `已為你建立新帳號並完成報名！\n` +
                  `${eventName}\n` +
                  `${sessionName} ${start}${extra}\n\n` +
                  `登入帳戶: ${result.user?.user_id}\n` +
                  `密碼: ${mobile}\n\n` +
                  `CRM: ${crmUrl}\n\n` +
                  `如需返回查看免費講座，請輸入：返回`
                )
              : (
                  `已使用你現有帳號並完成報名！\n` +
                  `${eventName}\n` +
                  `${sessionName} ${start}${extra}\n\n` +
                  `可登入CRM查看:\n` +
                  `${crmUrl}\n\n` +
                  `如需返回查看免費講座，請輸入：返回`
                ),
            valueMetadata: value?.metadata
          });

          setState(from, { step: 'IDLE' });
        })().catch((e) => {
          console.error('WhatsApp registration failed:', e?.message || e);
        });

        return res.sendStatus(200);
      }
    }
  } catch (e) {
    console.error('WhatsApp webhook handler error:', e);
  }

  return res.sendStatus(200);
});

module.exports = router;
