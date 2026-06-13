import { buildVerificationEmail } from './emailTemplates/verificationEmail.template.js';

const requiredSmtpConfig = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
];

const hasSmtpConfig = () =>
  requiredSmtpConfig.every((key) => Boolean(process.env[key])) &&
  Boolean(process.env.SMTP_PASS || process.env.SMTP_PASSWORD);

const createTransporter = async () => {
  const { default: nodemailer } = await import('nodemailer');

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS:
      process.env.SMTP_SECURE !== 'true' &&
      process.env.SMTP_STARTTLS !== 'false',
    ignoreTLS:
      process.env.SMTP_SECURE !== 'true' &&
      process.env.SMTP_STARTTLS === 'false',
    name: process.env.SMTP_EHLO_DOMAIN || 'localhost',
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
    },
  });
};

export const EmailService = {
  isConfigured() {
    return hasSmtpConfig();
  },

  async sendPasswordResetEmail({ to, username, resetUrl }) {
    if (!hasSmtpConfig()) {
      throw Object.assign(new Error('SMTP configuration is missing.'), {
        code: 'SMTP_NOT_CONFIGURED',
      });
    }

    const transporter = await createTransporter();
    const displayName = username || 'there';
    const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
      from,
      to,
      subject: 'Reset your SUPMOVIES password',
      text: [
        `Hello ${displayName},`,
        '',
        'We received a request to reset your SUPMOVIES password.',
        `Open this link to choose a new password: ${resetUrl}`,
        '',
        'This link expires in 1 hour. If you did not request this, you can ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
          <h1 style="font-size: 22px; margin-bottom: 12px;">Reset your SUPMOVIES password</h1>
          <p>Hello ${displayName},</p>
          <p>We received a request to reset your SUPMOVIES password.</p>
          <p>
            <a href="${resetUrl}" style="display:inline-block;background:#D0021B;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">
              Choose a new password
            </a>
          </p>
          <p style="font-size: 14px; color: #6b7280;">
            This link expires in 1 hour. If you did not request this, you can ignore this email.
          </p>
        </div>
      `,
    });
  },

  async sendVerificationEmail({ to, username, verificationUrl }) {
    if (!hasSmtpConfig()) {
      throw Object.assign(new Error('SMTP configuration is missing.'), {
        code: 'SMTP_NOT_CONFIGURED',
      });
    }

    const transporter = await createTransporter();
    const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;
    const content = buildVerificationEmail({ username, verificationUrl });

    const info = await transporter.sendMail({
      from,
      to,
      ...content,
    });

    console.log('Verification email accepted by SMTP', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return info;
  },
};
