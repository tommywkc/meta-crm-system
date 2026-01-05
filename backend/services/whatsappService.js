function getWhatsAppApiVersion() {
  return (process.env.WHATSAPP_API_VERSION || 'v20.0').trim();
}

function getWhatsAppAccessToken() {
  return (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
}

function getPhoneNumberId(valueMetadata) {
  return (
    (valueMetadata && valueMetadata.phone_number_id) ||
    (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim() ||
    ''
  );
}

async function sendWhatsAppText({ to, body, phoneNumberId, valueMetadata }) {
  const token = getWhatsAppAccessToken();
  const resolvedPhoneNumberId = phoneNumberId || getPhoneNumberId(valueMetadata);

  if (!token) {
    throw new Error('Missing WHATSAPP_ACCESS_TOKEN');
  }
  if (!resolvedPhoneNumberId) {
    throw new Error('Missing WHATSAPP_PHONE_NUMBER_ID');
  }
  if (!to) {
    throw new Error('Missing recipient `to`');
  }

  const apiVersion = getWhatsAppApiVersion();
  const url = `https://graph.facebook.com/${apiVersion}/${resolvedPhoneNumberId}/messages`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: String(body ?? '') }
    })
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`WhatsApp send failed: ${resp.status} ${text}`);
  }

  return resp.json().catch(() => ({}));
}

module.exports = {
  sendWhatsAppText
};
