import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
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
      message: 'Profil mis à jour.',
      user: updatedUser,
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// PATCH /api/users/me/password
// =====================
export const updatePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Les deux mots de passe sont requis.' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit faire au moins 8 caractères.' });
    }

    // Récupère le user avec le hash
    const user = await UserModel.findByIdWithPassword(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    // Vérifie l'ancien mot de passe
    const isValid = await bcrypt.compare(current_password, user.password_hash);

    if (!isValid) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect.' });
    }

    // Hash et sauvegarde le nouveau
    const newHash = await bcrypt.hash(new_password, 10);
    await UserModel.updatePassword(req.user.userId, newHash);

    res.json({ message: 'Mot de passe mis à jour avec succès.' });

  } catch (err) {
    next(err);
  }
};

// =====================
// PATCH /api/users/me/avatar
// =====================
export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni.' });
    }

    const userId = req.user.userId;

    // Récupère l'ancien avatar pour le supprimer
    const user = await UserModel.findById(userId);
    if (user?.avatar_url) {
      const oldPath = path.join('uploads', 'avatars', path.basename(user.avatar_url));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // URL publique de l'avatar
     const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
     const avatarUrl = `${BASE_URL}/uploads/avatars/${req.file.filename}`;

    const updatedUser = await UserModel.updateById(userId, { avatar_url: avatarUrl });

    const { password_hash, ...safeUser } = updatedUser;

    res.json({
      message: 'Avatar mis à jour.',
      user: safeUser,
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// GET /api/users/me/export
// =====================
export const exportMyData = async (req, res, next) => {
  try {
    const format = req.query.format === 'csv' ? 'csv' : 'json';
    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    const { password_hash, ...safeUser } = user;

    if (format === 'csv') {
      const headers = Object.keys(safeUser).join(',');
      const values = Object.values(safeUser)
        .map((v) => {
          if (v === null || v === undefined) return '';
          if (Array.isArray(v)) return `"${v.join(';')}"`;
          return `"${String(v).replace(/"/g, '""')}"`;
        })
        .join(',');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="supmovies-data.csv"');
      return res.send(`${headers}\n${values}`);
    }

    // JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="supmovies-data.json"');
    res.json({
      exported_at: new Date().toISOString(),
      data: safeUser,
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// DELETE /api/users/me
// =====================
export const deleteMe = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Supprime l'avatar si existant
    const user = await UserModel.findById(userId);
    if (user?.avatar_url) {
      const avatarPath = path.join('uploads', 'avatars', path.basename(user.avatar_url));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    await UserModel.deleteById(userId);

    res.json({ message: 'Compte supprimé avec succès.' });

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

    const { password_hash, is_banned, email, ...publicUser } = user;

    res.json({ user: publicUser });

  } catch (err) {
    next(err);
  }
};
