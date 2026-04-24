import { UserModel } from '../../models/user.model.js';

// =====================
// GET /api/users/me
// =====================
export const getMe = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    const { password_hash, ...safeUser } = user;

    res.json({ user: safeUser });

  } catch (err) {
    next(err);
  }
};

// =====================
// PUT /api/users/me
// =====================
export const updateMe = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const updatedUser = await UserModel.updateById(userId, req.body);

    res.json({
      message: "Profil mis à jour",
      user: updatedUser
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// GET /api/users/:id (PUBLIC)
// =====================
export const getUserById = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    // 🔒 cacher infos sensibles
    const {
      password_hash,
      is_banned,
      email, // optionnel → cacher si profil public
      ...publicUser
    } = user;

    res.json({ user: publicUser });

  } catch (err) {
    next(err);
  }
};