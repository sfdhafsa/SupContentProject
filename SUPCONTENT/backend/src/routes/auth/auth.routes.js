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

const encodeOAuthState = (payload) =>
  Buffer.from(JSON.stringify(payload)).toString('base64url');

const decodeOAuthState = (state) => {
  if (!state) return {};

  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  } catch {
    return {};
  }
};

const getOAuthFailureUrl = (provider, state, errorCode = `oauth_${provider}`) => {
  const { redirectUri } = decodeOAuthState(state);
  const fallbackUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;
  const failureUrl = new URL(redirectUri || fallbackUrl);
  failureUrl.searchParams.set('error', errorCode);
  return failureUrl.toString();
};

const getRequestOrigin = (req) => {
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  return `${protocol}://${req.get('host')}`;
};

const getGoogleCallbackUrl = (req) => {
  const envCallbackUrl = process.env.GOOGLE_CALLBACK_URL;

  if (process.env.NODE_ENV === 'production' && envCallbackUrl) {
    return envCallbackUrl;
  }

  return `${getRequestOrigin(req)}/api/auth/google/callback`;
};

const isDevelopmentRedirect = (url) => {
  if (process.env.NODE_ENV === 'production') return false;

  const localPorts = new Set(['8081', '8082', '8083', '5173']);
  const hostname = url.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isLanIp = /^(10|172\.(1[6-9]|2\d|3[0-1])|192\.168)\.\d{1,3}\.\d{1,3}$/.test(hostname);

  return (isLocalhost || isLanIp) && localPorts.has(url.port);
};

const getOAuthRedirectUrl = (req) => {
  const redirectUri = typeof req.query.redirect_uri === 'string' ? req.query.redirect_uri : '';
  const allowedRedirects = new Set([
    process.env.CLIENT_URL,
    process.env.MOBILE_CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8082',
    'http://127.0.0.1:8082',
    'http://localhost:8083',
    'http://127.0.0.1:8083',
    'supcontent://',
  ].filter(Boolean));

  if (!redirectUri) return undefined;

  try {
    const url = new URL(redirectUri);
    const origin = url.protocol === 'supcontent:' ? 'supcontent://' : url.origin;

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

  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    callbackURL: getGoogleCallbackUrl(req),
    state: redirectUri ? encodeOAuthState({ redirectUri }) : undefined,
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
