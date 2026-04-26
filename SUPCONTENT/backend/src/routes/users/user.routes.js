import express from 'express';
import {
  getMe,
  updateMe,
  getUserById
} from '../../controllers/users/user.controllers.js';

import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// 🔐 profil connecté
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

// 🌍 profil public
router.get('/:id', getUserById);

export default router;