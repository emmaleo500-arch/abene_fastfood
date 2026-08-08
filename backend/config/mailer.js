const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST,
  port:   Number(process.env.MAIL_PORT) || 465,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Send an email.
 * @param {object} opts  { to, subject, html }
 */
const sendMail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from:    process.env.MAIL_FROM,
      to,
      subject,
      html,
    });
  } catch (err) {
    // Log but never crash the request because of a mail failure
    console.error(' Mail error:', err.message);
  }
};

module.exports = sendMail;
