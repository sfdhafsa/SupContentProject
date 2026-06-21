const BREVO_EMAIL_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

const getConfig = () => ({
  apiKey: process.env.BREVO_API_KEY,
  fromEmail: process.env.EMAIL_FROM_ADDRESS,
  fromName: process.env.EMAIL_FROM_NAME || "SUPMOVIES Notifications",
});

export const isBrevoConfigured = () => {
  const config = getConfig();
  return Boolean(config.apiKey && config.fromEmail);
};

export const sendBrevoEmail = async ({ to, subject, text, html }) => {
  const config = getConfig();

  if (!config.apiKey || !config.fromEmail) {
    throw Object.assign(new Error("Brevo email configuration is missing."), {
      code: "BREVO_NOT_CONFIGURED",
    });
  }

  const payload = {
    sender: { name: config.fromName, email: config.fromEmail },
    to: [{ email: to }],
    subject,
  };

  if (text) payload.textContent = text;
  if (html) payload.htmlContent = html;

  const response = await fetch(BREVO_EMAIL_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": config.apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Brevo email failed (${response.status}): ${details}`);
  }

  return true;
};
