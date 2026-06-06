import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import { UserModel } from '../../models/user.model.js';
import { RoleModel } from '../../models/role.model.js';
import { signToken } from '../../utils/jwt.utils.js';
import { TokenBlacklistModel } from '../../models/tokenBlacklist.model.js';

const SALT_ROUNDS = 12;

// =====================
// REGISTER
// =====================
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password } = req.body;

    // Check uniqueness
    if (await UserModel.findByEmail(email)) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    if (await UserModel.findByUsername(username)) {
      return res.status(409).json({ message: 'Ce nom d\'utilisateur est déjà pris.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await UserModel.createLocal({
      email,
      username,
      passwordHash
    });

    const roles = await RoleModel.getRolesByUserId(user.id);
    const normalizedRoles = roles.map(role => String(role).toLowerCase());

    const token = signToken({
      userId: user.id,
      roles: normalizedRoles
    });

    const { password_hash, ...safeUser } = user;

    return res.status(201).json({
      message: 'Compte créé avec succès.',
      token,
      user: {
        ...safeUser,
        roles: normalizedRoles
      }
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// LOGIN
// =====================
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);

    if (!user || !user.password_hash) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    if (user.is_banned) {
      return res.status(403).json({ message: 'Ce compte a été suspendu.' });
    }

    // Check password
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    // Get full user (clean profile)
    const fullUser = await UserModel.findById(user.id);
    const roles = fullUser.roles || [];

    const token = signToken({
      userId: user.id,
      roles
    });

    const { password_hash, ...safeUser } = fullUser;

    return res.json({
      message: 'Connexion réussie.',
      token,
      user: {
        ...safeUser,
        roles
      }
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// LOGOUT
// =====================
export const logout = async (req, res, next) => {
  try {
    if (!req.user?.token || !req.user?.tokenExpiresAt) {
      return res.status(400).json({ message: 'Token manquant.' });
    }

    await TokenBlacklistModel.add(req.user.token, req.user.tokenExpiresAt);

    return res.json({ message: 'Déconnexion réussie.' });
  } catch (err) {
    next(err);
  }
};

// =====================
// OAUTH CALLBACK
// =====================
export const oauthCallback = (req, res) => {
  const user = req.user;

  if (!user) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }

  const token = signToken({
    userId: user.id,
    roles: user.roles || []
  });

  return res.redirect(
    `${process.env.CLIENT_URL}/auth/callback?token=${token}`
  );
};
