import express from 'express';
import { body } from 'express-validator';
import {
  getMe,
  updateMe,
  updatePassword,
  updateAvatar,
  getNotificationPreferences,
  updateNotificationPreferences,
  exportMyData,
  deleteMe,
  getPublicUserActivity,
  getUserById,
  searchUsers,
} from '../../controllers/users/user.controllers.js';

import { protect } from '../../middlewares/auth.middleware.js';
import { uploadAvatarFile } from '../../middlewares/upload.middleware.js';

const router = express.Router();

const updateMeRules = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Username : 3 à 100 caractères.'),
  body('website_url')
    .optional({ nullable: true, checkFalsy: true })
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Website URL invalide. Utilisez http:// ou https://.'),
  body('theme_preference')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme invalide.'),
  body('language_preference')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('Langue invalide.'),
];

const passwordRules = [
  body('current_password')
    .notEmpty()
    .withMessage('Mot de passe actuel requis.'),
  body('new_password')
    .isLength({ min: 8 })
    .withMessage('8 caractères minimum.')
    .matches(/[A-Z]/)
    .withMessage('Au moins une majuscule.')
    .matches(/[0-9]/)
    .withMessage('Au moins un chiffre.'),
];

const notificationPreferenceRules = [
  body('notification_push_enabled')
    .optional()
    .isBoolean()
    .withMessage('notification_push_enabled doit etre un booleen.')
    .toBoolean(),
  body('notification_email_enabled')
    .optional()
    .isBoolean()
    .withMessage('notification_email_enabled doit etre un booleen.')
    .toBoolean(),
  body('notification_likes_enabled')
    .optional()
    .isBoolean()
    .withMessage('notification_likes_enabled doit etre un booleen.')
    .toBoolean(),
  body('notification_comments_enabled')
    .optional()
    .isBoolean()
    .withMessage('notification_comments_enabled doit etre un booleen.')
    .toBoolean(),
  body('notification_followers_enabled')
    .optional()
    .isBoolean()
    .withMessage('notification_followers_enabled doit etre un booleen.')
    .toBoolean(),
];

// ⚠️ IMPORTANT : les routes /me/* doivent être AVANT /:id
// sinon Express interprète "me" comme un :id

// =====================
// 🔐 Routes protégées
// =====================

// Profil
router.get('/me',              protect, getMe);
router.put('/me',              protect, updateMeRules, updateMe);

// Mot de passe
router.patch('/me/password',   protect, passwordRules, updatePassword);
router.get('/me/notification-preferences', protect, getNotificationPreferences);
router.patch('/me/notification-preferences', protect, notificationPreferenceRules, updateNotificationPreferences);

// Avatar — multer traite le fichier avant le controller
router.patch('/me/avatar',     protect, uploadAvatarFile, updateAvatar);

// Export données (JSON ou CSV) → ?format=json | ?format=csv
router.get('/me/export',       protect, exportMyData);

// Suppression compte
router.delete('/me',           protect, deleteMe);

// =====================
// 🌍 Routes publiques
// =====================
router.get('/search',          protect, searchUsers);
router.get('/:id/activity',    getPublicUserActivity);
router.get('/:id',             getUserById);

export default router;
