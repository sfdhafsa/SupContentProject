import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { register, login,oauthCallback } from '../../controllers/auth/auth.controllers.js';
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
const oauthFailure = (provider) =>
  `${process.env.CLIENT_URL}/login?error=oauth_${provider}`;

router.post('/register', authLimiter, registerRules, register);
router.post('/login',    authLimiter, loginRules,    login);

// ── Google ───────────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: oauthFailure('google'), session: false }),
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