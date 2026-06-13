const escapeHtml = (value) =>
  String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export const buildVerificationEmail = ({ username, verificationUrl }) => {
  const displayName = escapeHtml(username || 'there');
  const safeVerificationUrl = escapeHtml(verificationUrl);

  return {
    subject: 'Verify your SUPMOVIES email address',
    text: [
      `Hello ${username || 'there'},`,
      '',
      'Please verify your SUPMOVIES email address by opening this link:',
      verificationUrl,
      '',
      'This link expires in 24 hours and can only be used once.',
      'If you did not create this account, you can ignore this email.',
    ].join('\n'),
    html: `
      <div style="background:#f3f4f6;padding:32px 16px;font-family:Arial,sans-serif;color:#111827;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
          <h1 style="font-size:24px;margin:0 0 16px;">Verify your email address</h1>
          <p>Hello ${displayName},</p>
          <p>Confirm your email address to finish creating your SUPMOVIES account.</p>
          <p style="margin:28px 0;">
            <a href="${safeVerificationUrl}" style="display:inline-block;background:#D0021B;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">
              Verify my email
            </a>
          </p>
          <p style="font-size:14px;color:#6b7280;">
            This link expires in 24 hours and can only be used once.
            If you did not create this account, you can ignore this email.
          </p>
        </div>
      </div>
    `,
  };
};
