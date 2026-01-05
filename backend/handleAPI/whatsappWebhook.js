const express = require('express');
const crypto = require('crypto');

const { handleWhatsAppWebhookPayload } = require('./whatsapp/handler');

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

  void handleWhatsAppWebhookPayload(body).catch((e) => {
    console.error('WhatsApp webhook handler error:', e?.message || e);
  });

  return res.sendStatus(200);
});

module.exports = router;
