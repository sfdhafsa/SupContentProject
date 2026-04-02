import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { register, login, getMe } from '../../controllers/auth/auth.controllers.js';
import { protect } from '../../middlewares/auth.middleware.js';

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

router.post('/register', authLimiter, registerRules, register);
router.post('/login',    authLimiter, loginRules,    login);
router.get ('/me',       protect,                    getMe);

export default router;