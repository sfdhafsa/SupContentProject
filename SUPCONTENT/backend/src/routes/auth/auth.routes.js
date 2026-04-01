import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe } from '../../controllers/auth/auth.controllers.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

const registerRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('8 caractères minimum'),
  body('username').trim().isLength({ min: 3, max: 30 }),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register', registerRules, register);
router.post('/login',    loginRules,    login);
 router.get ('/me',       protect,       getMe);

export default router;