const express = require('express');
const crypto = require('crypto');

const { sendWhatsAppText } = require('../services/whatsappService');
const { findOpenFreeSeminars } = require('../dao/eventsDao');
const { listByEventId } = require('../dao/eventSessionsDao');

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

function formatRemainingSeats(remaining, capacity) {
  const r = remaining == null ? null : Number(remaining);
  const c = capacity == null ? null : Number(capacity);
  if (Number.isFinite(r) && Number.isFinite(c)) return `${r}/${c}`;
  if (Number.isFinite(r)) return `${r}`;
  return '未知';
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
      void (async () => {
        const seminars = await findOpenFreeSeminars();

        let reply;
        if (!seminars || seminars.length === 0) {
          reply = '目前沒有開放中的免費講座。';
          setState(from, { step: 'IDLE' });
        } else {
          const lines = ['以下是目前免費的講座'];
          seminars.forEach((s, idx) => {
            const start = formatDateTimeHK(s.datetime_start);
            const seats = formatRemainingSeats(s.remaining_seats, s.capacity);
            lines.push(`${idx + 1}. ${s.event_name}（開始日期 ${start}，餘下位置 ${seats}）`);
          });
          lines.push('如有興趣，請輸入相應的數字（例如：輸入 1）');
          reply = lines.join('\n');
          setState(from, { step: 'SEMINAR_MENU', seminars });
        }

        await sendWhatsAppText({
          to: String(from),
          body: reply,
          valueMetadata: value?.metadata
        });
      })().catch((e) => {
        console.error('WhatsApp back-to-menu failed:', e?.message || e);
      });

      return res.sendStatus(200);
    }

    // Step 1: user sends "test" -> list open free seminars
    if (normalized === 'test') {
      void (async () => {
        const seminars = await findOpenFreeSeminars();

        let reply;
        if (!seminars || seminars.length === 0) {
          reply = '目前沒有開放中的免費講座。';
        } else {
          const lines = ['以下是目前免費的講座'];
          seminars.forEach((s, idx) => {
            const start = formatDateTimeHK(s.datetime_start);
            const seats = formatRemainingSeats(s.remaining_seats, s.capacity);
            lines.push(`${idx + 1}. ${s.event_name}（開始日期 ${start}，餘下位置 ${seats}）`);
          });
          lines.push('如有興趣，請輸入相應的數字（例如：輸入 1）');
          reply = lines.join('\n');
        }

        if (seminars && seminars.length > 0) {
          setState(from, { step: 'SEMINAR_MENU', seminars });
        } else {
          setState(from, { step: 'IDLE' });
        }

        await sendWhatsAppText({
          to: String(from),
          body: reply,
          valueMetadata: value?.metadata
        });
      })().catch((e) => {
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
      if (!state || state.step !== 'SEMINAR_MENU' || !Array.isArray(state.seminars)) {
        void sendWhatsAppText({
          to: String(from),
          body: '請先輸入 Test 取得講座清單。',
          valueMetadata: value?.metadata
        }).catch(() => {});
        return res.sendStatus(200);
      }

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
          reply = `「${eventName}」目前未有場次。`;
        } else {
          const lines = [`以下是${eventName}的場次`];
          sorted.forEach((s, i) => {
            const start = formatDateTimeHK(s.datetime_start);
            const seats = formatRemainingSeats(s.remaining_seats, s.capacity);
            lines.push(`${i + 1}. ${s.session_name}（開始日期 ${start}，餘下位置 ${seats}）`);
          });
          lines.push('如有興趣，請輸入相應的數字（例如：輸入 1）');
          lines.push('如需返回查看免費講座，請輸入：返回');
          reply = lines.join('\n');
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
  } catch (e) {
    console.error('WhatsApp webhook handler error:', e);
  }

  return res.sendStatus(200);
});

module.exports = router;
