import { validationResult } from "express-validator";
import { UserModel } from "../../models/user.model.js";

export const promoteUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await UserModel.promoteToAdmin(req.params.id);

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
