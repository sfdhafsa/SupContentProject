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
    state: redirectUri ? Buffer.from(JSON.stringify({ redirectUri })).toString('base64url') : undefined,
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: false
  }),
  oauthCallback
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
