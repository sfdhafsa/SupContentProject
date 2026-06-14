const GOOGLE_PLACEHOLDER_PATTERN = /^(your_|google_client_id_here|google_client_secret_here)/i;

const getWebClientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

const getMobileClientUrl = () =>
  process.env.MOBILE_CLIENT_URL || 'supcontent://auth/callback';

const normalizeClient = (client) => client === 'mobile' ? 'mobile' : 'web';

const isPrivateDevHost = (hostname) =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname.startsWith('192.168.') ||
  hostname.startsWith('10.') ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

const getForwardedValue = (req, header) => {
  const value = req.get(header);
  return value?.split(',')[0]?.trim();
};

const getRequestOrigin = (req) => {
  const protocol = getForwardedValue(req, 'x-forwarded-proto') || req.protocol;
  const host = getForwardedValue(req, 'x-forwarded-host') || req.get('host');

  if (!host || !['http', 'https'].includes(protocol)) return undefined;
  return `${protocol}://${host}`;
};

const isLocalGoogleCallbackHost = (hostname) =>
  hostname === 'localhost' || hostname === '127.0.0.1';

const canGoogleUseCallback = (callbackUrl) => {
  try {
    const url = new URL(callbackUrl);

    if (url.protocol === 'https:' && !isPrivateDevHost(url.hostname)) {
      return true;
    }

    return url.protocol === 'http:' && isLocalGoogleCallbackHost(url.hostname);
  } catch {
    return false;
  }
};

const getDefaultClientRedirectUri = (client) => {
  if (client === 'mobile') return getMobileClientUrl();
  return `${getWebClientUrl()}/auth/callback`;
};

const isAllowedClientRedirectUri = (redirectUri, client) => {
  try {
    const url = new URL(redirectUri);

    if (client === 'mobile' && ['supcontent:', 'exp:', 'exps:'].includes(url.protocol)) {
      return true;
    }

    if (!['http:', 'https:'].includes(url.protocol) || url.pathname !== '/auth/callback') {
      return false;
    }

    if (process.env.NODE_ENV !== 'production' && isPrivateDevHost(url.hostname)) {
      return true;
    }

    const allowedOrigin = client === 'mobile'
      ? new URL(getMobileClientUrl()).origin
      : new URL(getWebClientUrl()).origin;

    return url.origin === allowedOrigin;
  } catch {
    return false;
  }
};

export const getGoogleOAuthConfigError = () => {
  if (!process.env.GOOGLE_CLIENT_ID || GOOGLE_PLACEHOLDER_PATTERN.test(process.env.GOOGLE_CLIENT_ID)) {
    return 'GOOGLE_CLIENT_ID must be set to a real Google OAuth web client id.';
  }

  if (!process.env.GOOGLE_CLIENT_SECRET || GOOGLE_PLACEHOLDER_PATTERN.test(process.env.GOOGLE_CLIENT_SECRET)) {
    return 'GOOGLE_CLIENT_SECRET must be set to the matching Google OAuth client secret.';
  }

  return undefined;
};

export const getGoogleCallbackUrl = (req) => {
  const configuredCallback =
    process.env.GOOGLE_CALLBACK_URL ||
    'http://localhost:3000/api/auth/google/callback';

  if (process.env.NODE_ENV === 'production') return configuredCallback;

  const requestOrigin = getRequestOrigin(req);
  if (!requestOrigin) return configuredCallback;

  try {
    const requestUrl = new URL(requestOrigin);
    const candidate = `${requestUrl.origin}/api/auth/google/callback`;
    return canGoogleUseCallback(candidate) ? candidate : configuredCallback;
  } catch {
    return configuredCallback;
  }
};

export const assertGoogleCallbackSupported = (callbackUrl) => {
  if (canGoogleUseCallback(callbackUrl)) return undefined;
  return 'Google OAuth callback must be localhost, 127.0.0.1, or a public HTTPS URL.';
};

export const buildOAuthState = (req) => {
  const client = normalizeClient(req.query.client);
  const requestedRedirectUri =
    typeof req.query.redirect_uri === 'string' ? req.query.redirect_uri : '';
  const redirectUri = requestedRedirectUri || getDefaultClientRedirectUri(client);

  if (!isAllowedClientRedirectUri(redirectUri, client)) {
    return {
      error: `Invalid ${client} OAuth redirect_uri.`,
    };
  }

  return {
    client,
    redirectUri,
    value: Buffer.from(JSON.stringify({ client, redirectUri })).toString('base64url'),
  };
};

export const getClientRedirectUrlFromOAuthState = (state) => {
  if (!state) return `${getWebClientUrl()}/auth/callback`;

  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    const client = normalizeClient(parsed.client);
    const redirectUri = parsed.redirectUri || getDefaultClientRedirectUri(client);

    if (isAllowedClientRedirectUri(redirectUri, client)) {
      return redirectUri;
    }

    return getDefaultClientRedirectUri(client);
  } catch {
    return `${getWebClientUrl()}/auth/callback`;
  }
};
