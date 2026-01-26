require('dotenv').config();
const sgMail = require('@sendgrid/mail');

// Configure SendGrid once using the API key from .env
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Minimal helper used by /api/email/send.
// It sends one email when called; no extra features.
async function sendEmail({ to, subject, text, html }) {
  const from = process.env.SENDGRID_FROM || process.env.SENDGRID_VERIFIED_SENDER;

  const msg = {
    to,
    from,
    subject,
    text,
    html
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent to', to);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = {
  sendEmail
};