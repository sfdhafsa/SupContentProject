import { isBrevoConfigured, sendBrevoEmail } from './brevoEmail.service.js';

export const EmailService = {
  isConfigured() {
    return isBrevoConfigured();
  },

  async sendPasswordResetEmail({ to, username, resetUrl }) {
    const displayName = username || 'there';

    await sendBrevoEmail({
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
};
