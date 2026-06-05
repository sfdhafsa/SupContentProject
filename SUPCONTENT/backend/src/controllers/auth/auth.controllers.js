import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import { UserModel } from '../../models/user.model.js';
import { RoleModel } from '../../models/role.model.js';
import { signToken } from '../../utils/jwt.utils.js';
import { TokenBlacklistModel } from '../../models/tokenBlacklist.model.js';
import { PasswordResetModel } from '../../models/passwordReset.model.js';
import { EmailService } from '../../services/email.service.js';

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const hashResetToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

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

    // Get roles
    const roles = await RoleModel.getRolesByUserId(user.id);

    // Generate JWT (IMPORTANT: roles included)
    const token = signToken({
      userId: user.id,
      roles
    });

    const { password_hash, ...safeUser } = user;

    return res.status(201).json({
      message: 'Compte créé avec succès.',
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

    // Get roles
    const roles = await RoleModel.getRolesByUserId(user.id);

    // Generate JWT (IMPORTANT)
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
// FORGOT PASSWORD
// =====================
export const requestPasswordReset = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await UserModel.findByEmail(email);

    const response = {
      message: 'Si ce compte existe, un lien de réinitialisation a été généré.',
    };

    if (!user) {
      return res.json(response);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await PasswordResetModel.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${getClientUrl()}/reset-password?token=${rawToken}`;

    if (EmailService.isConfigured()) {
      await EmailService.sendPasswordResetEmail({
        to: user.email,
        username: user.username,
        resetUrl,
      });
    }

    if (process.env.NODE_ENV !== 'production' && !EmailService.isConfigured()) {
      response.reset_url = resetUrl;
    }

    return res.json(response);
  } catch (err) {
    next(err);
  }
};

// =====================
// RESET PASSWORD
// =====================
export const resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;
    const tokenHash = hashResetToken(token);
    const resetToken = await PasswordResetModel.findValidByHash(tokenHash);

    if (!resetToken) {
      return res.status(400).json({ message: 'Lien invalide ou expiré.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await UserModel.updatePassword(resetToken.user_id, passwordHash);
    await PasswordResetModel.markUsed(resetToken.id);

    return res.json({ message: 'Mot de passe réinitialisé avec succès.' });
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
