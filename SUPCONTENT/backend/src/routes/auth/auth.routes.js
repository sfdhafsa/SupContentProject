import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  logout,
  requestPasswordReset,
  resetPassword,
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

// ── Google ───────────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  const redirectUri = getOAuthRedirectUrl(req);
  const client = typeof req.query.client === 'string' ? req.query.client : undefined;

  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    callbackURL: getGoogleCallbackUrl(req),
    state: redirectUri
      ? encodeOAuthState({ client, redirectUri })
      : undefined,
  })(req, res, next);
});

router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false, callbackURL: getGoogleCallbackUrl(req) }, (err, user, info) => {
      if (err) return next(err);

      if (!user) {
        const errorCode = info?.message === 'your account is banned'
          ? 'banned'
          : 'oauth_google';

        req.oauthError = errorCode;
        return oauthCallback(req, res);
        return res.redirect(getOAuthFailureUrl('google', req.query.state, errorCode));
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
  passport.authenticate('github', { failureRedirect: getOAuthFailureUrl('github'), session: false }),
  oauthCallback
);

// ── Facebook ─────────────────────────────────────────────────────
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'], session: false })
);
router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: getOAuthFailureUrl('facebook'), session: false }),
  oauthCallback
);

export default router;
