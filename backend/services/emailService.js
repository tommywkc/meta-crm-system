require('dotenv').config();
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail({ to, subject, text, html, attachments }) {
  const from = process.env.SENDGRID_FROM || process.env.SENDGRID_VERIFIED_SENDER;

  const msg = {
    to,
    from,
    subject,
    text,
    html,
    // Optional inline or regular attachments (e.g. QR code images)
    attachments
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