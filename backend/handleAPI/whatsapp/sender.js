const { sendWhatsAppText } = require('../../services/whatsappService');

function sendText(to, body, valueMetadata) {
  return sendWhatsAppText({
    to: String(to),
    body: String(body ?? ''),
    valueMetadata,
  });
}

module.exports = {
  sendText,
};
