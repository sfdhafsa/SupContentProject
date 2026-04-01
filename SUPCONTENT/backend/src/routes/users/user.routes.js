import { Router } from 'express';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

// On le remplira à l'étape 4 (profil, avatar, export)
router.get('/profile', protect, (req, res) => {
  res.json({ user: req.user });
});

export default router;