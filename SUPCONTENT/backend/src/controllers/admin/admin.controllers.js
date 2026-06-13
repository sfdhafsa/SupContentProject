import { validationResult } from "express-validator";
import { isSuperAdminUser, UserModel } from "../../models/user.model.js";

export const promoteUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.params.id === req.user?.id) {
      return res.status(400).json({
        message: "Vous ne pouvez pas modifier votre propre role admin.",
      });
    }

    const user = await UserModel.promoteToAdmin(req.params.id, req.user?.id);

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    return res.json({
      message: "Utilisateur promu admin.",
      user,
    });
  } catch (err) {
    next(err);
  }
};

export const unpromoteUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.params.id === req.user?.id) {
      return res.status(400).json({
        message: "Vous ne pouvez pas modifier votre propre role admin.",
      });
    }

    const targetUser = await UserModel.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    if (isSuperAdminUser(targetUser)) {
      return res.status(403).json({
        message: "Le super admin de la plateforme ne peut pas etre retire des admins.",
      });
    }

    const user = await UserModel.unpromoteFromAdmin(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable.",
      });
    }

    return res.json({
      message: "Utilisateur retire des admins.",
      user,
    });
  } catch (err) {
    next(err);
  }
};
