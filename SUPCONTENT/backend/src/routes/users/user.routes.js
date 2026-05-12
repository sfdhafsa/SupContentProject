import express from 'express';
import {
  getMe,
  updateMe,
  updatePassword,
  updateAvatar,
  exportMyData,
  deleteMe,
  getUserById,
} from '../../controllers/users/user.controllers.js';

import { protect } from '../../middlewares/auth.middleware.js';
import { uploadAvatar } from '../../middlewares/upload.middleware.js';

const router = express.Router();

// ⚠️ IMPORTANT : les routes /me/* doivent être AVANT /:id
// sinon Express interprète "me" comme un :id

// =====================
// 🔐 Routes protégées
// =====================

// Profil
router.get('/me',              protect, getMe);
router.put('/me',              protect, updateMe);

// Mot de passe
router.patch('/me/password',   protect, updatePassword);

// Avatar — multer traite le fichier avant le controller
router.patch('/me/avatar',     protect, uploadAvatar.single('avatar'), updateAvatar);

// Export données (JSON ou CSV) → ?format=json | ?format=csv
router.get('/me/export',       protect, exportMyData);

// Suppression compte
router.delete('/me',           protect, deleteMe);

// =====================
// 🌍 Routes publiques
// =====================
router.get('/:id',             getUserById);

export default router;
