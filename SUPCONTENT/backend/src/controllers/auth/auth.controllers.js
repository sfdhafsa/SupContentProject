import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import { UserModel } from '../../models/user.model.js';
import { signToken } from '../../utils/jwt.utils.js';
import { TokenBlacklistModel } from '../../models/tokenBlacklist.model.js';
import { PasswordResetModel } from '../../models/passwordReset.model.js';
import { EmailService } from '../../services/email.service.js';

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';
const createVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');

  return {
    rawToken,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
  };
};

const getVerificationUrl = (rawToken) => {
  const url = new URL('/verify-email', getClientUrl());
  url.searchParams.set('token', rawToken);
  return url.toString();
};

const ensureEmailCanBeSent = () => {
  if (process.env.NODE_ENV === 'production' && !EmailService.isConfigured()) {
    throw Object.assign(new Error('Email service is temporarily unavailable.'), {
      status: 503,
    });
  }
};

const getMobileClientUrl = () =>
  process.env.MOBILE_CLIENT_URL || 'supcontent://auth/callback';

const getOAuthCallbackUrl = (state) => {
  if (!state) return `${getClientUrl()}/auth/callback`;

  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    if (parsed.redirectUri) return parsed.redirectUri;
    if (parsed.client === 'mobile') return getMobileClientUrl();
    return `${getClientUrl()}/auth/callback`;
  } catch {
    return `${getClientUrl()}/auth/callback`;
  }
};

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
    ensureEmailCanBeSent();

    // Check uniqueness
    if (await UserModel.findByEmail(email)) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    if (await UserModel.findByUsername(username)) {
      return res.status(409).json({ message: 'Ce nom d\'utilisateur est déjà pris.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const { rawToken, tokenHash, expiresAt } = createVerificationToken();

    // Create user
    const user = await UserModel.createLocal({
      email,
      username,
      passwordHash,
      verificationToken: tokenHash,
      verificationTokenExpires: expiresAt,
    });

    const verificationUrl = getVerificationUrl(rawToken);
    if (EmailService.isConfigured()) {
      await EmailService.sendVerificationEmail({
        to: user.email,
        username: user.username,
        verificationUrl,
      });
    }

    return res.status(201).json({
      message: 'Compte cree. Consultez votre email pour valider votre adresse.',
      user,
      ...(process.env.NODE_ENV !== 'production' &&
        !EmailService.isConfigured() && { verification_url: verificationUrl }),
    });

  } catch (err) {
    next(err);
  }
};

// =====================
// VERIFY EMAIL
// =====================
export const verifyEmail = async (req, res, next) => {
  try {
    const rawToken = typeof req.query.token === 'string' ? req.query.token.trim() : '';

    if (!/^[a-f0-9]{64}$/i.test(rawToken)) {
      return res.status(400).json({ message: 'Token de verification requis.' });
    }

    const user = await UserModel.verifyEmailByToken(hashToken(rawToken));

    if (!user) {
      return res.status(400).json({ message: 'Lien de verification invalide ou expire.' });
    }

    return res.json({
      message: 'Adresse email verifiee avec succes.',
      user,
    });
  } catch (err) {
    next(err);
  }
};

// =====================
// RESEND VERIFICATION
// =====================
export const resendVerification = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    ensureEmailCanBeSent();

    const response = {
      message: 'Si ce compte existe et attend une validation, un nouvel email a ete envoye.',
    };
    const user = await UserModel.findByEmail(req.body.email);

    if (!user || user.is_verified) {
      return res.json(response);
    }

    const { rawToken, tokenHash, expiresAt } = createVerificationToken();
    const updatedUser = await UserModel.replaceVerificationToken(
      user.id,
      tokenHash,
      expiresAt
    );

    if (!updatedUser) {
      return res.json(response);
    }

    const verificationUrl = getVerificationUrl(rawToken);
    if (EmailService.isConfigured()) {
      await EmailService.sendVerificationEmail({
        to: updatedUser.email,
        username: updatedUser.username,
        verificationUrl,
      });
    }

    return res.json({
      ...response,
      ...(process.env.NODE_ENV !== 'production' &&
        !EmailService.isConfigured() && { verification_url: verificationUrl }),
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
      return res.status(403).json({ message: 'your account is banned' });
    }

    // Check password
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        message: 'Veuillez verifier votre adresse email avant de vous connecter.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // Get full user (clean profile)
    const fullUser = await UserModel.findById(user.id);
    const roles = fullUser.roles || [];

    const token = signToken({
      userId: user.id,
      roles
    });

    const safeUser = fullUser;

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
    const tokenHash = hashToken(rawToken);
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
    const tokenHash = hashToken(token);
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
  const callbackUrl = new URL(getOAuthCallbackUrl(req.query.state));

  if (!user) {
    callbackUrl.searchParams.set('error', req.oauthError || 'oauth_failed');
    return res.redirect(callbackUrl.toString());
  }

  const token = signToken({
    userId: user.id,
    roles: user.roles || []
  });

  callbackUrl.searchParams.set('token', token);
  return res.redirect(callbackUrl.toString());
};
