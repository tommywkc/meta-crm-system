const express = require('express');
const crypto = require('crypto');

const { sendWhatsAppText } = require('../services/whatsappService');
const { findOpenFreeSeminars } = require('../dao/eventsDao');

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
    const normalized = String(textBody ?? '').trim().toLowerCase();

    if (from && normalized === 'test') {
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

        await sendWhatsAppText({
          to: String(from),
          body: reply,
          valueMetadata: value?.metadata
        });
      })().catch((e) => {
        console.error('WhatsApp auto-reply failed:', e?.message || e);
      });
    }
  } catch (e) {
    console.error('WhatsApp webhook handler error:', e);
  }

  return res.sendStatus(200);
});

module.exports = router;
