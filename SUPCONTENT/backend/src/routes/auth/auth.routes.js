import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  logout,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerification,
  oauthCallback,
} from '../../controllers/auth/auth.controllers.js';
import { protect } from '../../middlewares/auth.middleware.js';
import passport from "passport";
const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Trop de tentatives, réessayez dans 15 minutes.' },
});

const registerRules = [
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('username').trim().isLength({ min: 3, max: 100 }).withMessage('Username : 3 à 100 caractères.'),
  body('password')
    .isLength({ min: 8 }).withMessage('8 caractères minimum.')
    .matches(/[A-Z]/).withMessage('Au moins une majuscule.')
    .matches(/[0-9]/).withMessage('Au moins un chiffre.'),
];

const loginRules = [
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('password').notEmpty().withMessage('Mot de passe requis.'),
];

const forgotPasswordRules = [
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
];

const resendVerificationRules = [
  body('email').isEmail().withMessage('Email invalide.').normalizeEmail(),
];

const resetPasswordRules = [
  body('token').trim().notEmpty().withMessage('Token requis.'),
  body('password')
    .isLength({ min: 8 }).withMessage('8 caractères minimum.')
    .matches(/[A-Z]/).withMessage('Au moins une majuscule.')
    .matches(/[0-9]/).withMessage('Au moins un chiffre.'),
];

const oauthFailure = (provider) =>
  `${process.env.CLIENT_URL}/login?error=oauth_${provider}`;

const isPrivateDevHost = (hostname) =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname.startsWith('192.168.') ||
  hostname.startsWith('10.') ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

const isDevelopmentRedirect = (url) =>
  process.env.NODE_ENV !== 'production' &&
  ['http:', 'https:'].includes(url.protocol) &&
  url.pathname === '/auth/callback' &&
  isPrivateDevHost(url.hostname);

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

const getGoogleCallbackUrl = (req) => {
  const configuredCallback =
    process.env.GOOGLE_CALLBACK_URL ||
    'http://localhost:3000/api/auth/google/callback';

  if (process.env.NODE_ENV === 'production') return configuredCallback;

  try {
    const requestOrigin = getRequestOrigin(req);

    if (requestOrigin) {
      const requestUrl = new URL(requestOrigin);

      if (['localhost', '127.0.0.1'].includes(requestUrl.hostname)) {
        return `${requestUrl.origin}/api/auth/google/callback`;
      }

      if (requestUrl.protocol === 'https:' && !isPrivateDevHost(requestUrl.hostname)) {
        return `${requestUrl.origin}/api/auth/google/callback`;
      }
    }
  } catch {
    // The validation below will return a useful configuration error.
  }

  return configuredCallback;
};

const isUnsupportedGoogleCallback = (callbackUrl) => {
  try {
    const url = new URL(callbackUrl);
    return url.protocol === 'http:' &&
      isPrivateDevHost(url.hostname) &&
      !['localhost', '127.0.0.1'].includes(url.hostname);
  } catch {
    return true;
  }
};

const getOAuthRedirectUrl = (req) => {
  const redirectUri = typeof req.query.redirect_uri === 'string' ? req.query.redirect_uri : '';
  const client = typeof req.query.client === 'string' ? req.query.client : '';
  const allowedRedirects = new Set([
    process.env.CLIENT_URL,
    process.env.MOBILE_CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://localhost:8082',
    'http://127.0.0.1:8082',
    'http://localhost:8083',
    'http://127.0.0.1:8083',
    'http://localhost:19006',
    'http://127.0.0.1:19006',
    'supcontent://',
  ].filter(Boolean));
  const allowedProtocols = new Set(['supcontent:', 'exp:', 'exps:']);

  if (!redirectUri) {
    if (client !== 'mobile') return undefined;

    const requestOrigin = req.get('origin');
    if (requestOrigin && process.env.NODE_ENV !== 'production') {
      try {
        const originUrl = new URL(requestOrigin);
        if (isPrivateDevHost(originUrl.hostname)) {
          return `${originUrl.origin}/auth/callback`;
        }
      } catch {
        // Fall through to the configured mobile callback.
      }
    }

    return process.env.MOBILE_CLIENT_URL || 'supcontent://auth/callback';
  }

  try {
    const url = new URL(redirectUri);
    if (allowedProtocols.has(url.protocol)) return redirectUri;

    const origin = url.origin;
    if (
      process.env.NODE_ENV !== 'production' &&
      client === 'mobile' &&
      ['http:', 'https:'].includes(url.protocol) &&
      url.pathname === '/auth/callback' &&
      isPrivateDevHost(url.hostname)
    ) {
      return redirectUri;
    }


    if (url.protocol === 'exp:' || url.protocol === 'exps:') {
      return redirectUri;
    }

    if (isDevelopmentRedirect(url)) {
      return redirectUri;
    }

    return allowedRedirects.has(origin) ? redirectUri : undefined;
  } catch {
    return undefined;
  }
};

router.post('/register', authLimiter, registerRules, register);
router.post('/login',    authLimiter, loginRules,    login);
router.post('/logout',   protect, logout);
router.post('/forgot-password', authLimiter, forgotPasswordRules, requestPasswordReset);
router.post('/reset-password',  authLimiter, resetPasswordRules,  resetPassword);
router.get('/verify-email', authLimiter, verifyEmail);
router.post(
  '/resend-verification',
  authLimiter,
  resendVerificationRules,
  resendVerification
);

// ── Google ───────────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  const redirectUri = getOAuthRedirectUrl(req);
  const client = typeof req.query.client === 'string' ? req.query.client : undefined;
  const callbackURL = getGoogleCallbackUrl(req);

  if (isUnsupportedGoogleCallback(callbackURL)) {
    return res.status(500).json({
      message: 'Google OAuth requires GOOGLE_CALLBACK_URL to use localhost or a public HTTPS URL. Use an HTTPS tunnel when testing from Expo Go.',
    });
  }

  return passport.authenticate('google', {
    callbackURL,
    scope: ['profile', 'email'],
    session: false,
    state: redirectUri
      ? Buffer.from(JSON.stringify({ client, redirectUri })).toString('base64url')
      : undefined,
  })(req, res, next);
});

router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', {
      callbackURL: getGoogleCallbackUrl(req),
      session: false,
    }, (err, user, info) => {
      if (err) return next(err);

      if (!user) {
        const errorCode = info?.message === 'your account is banned'
          ? 'banned'
          : 'oauth_google';

        req.oauthError = errorCode;
        return oauthCallback(req, res);
      }

      req.user = user;
      return oauthCallback(req, res);
    })(req, res, next);
  }
);

// ── GitHub ───────────────────────────────────────────────────────
router.get('/github',
  passport.authenticate('github', { scope: ['user:email'], session: false })
);
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: oauthFailure('github'), session: false }),
  oauthCallback
);

// ── Facebook ─────────────────────────────────────────────────────
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'], session: false })
);
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: oauthFailure('facebook'), session: false }),
  oauthCallback
);

export default router;
