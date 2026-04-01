import bcrypt from 'bcrypt';
import { UserModel } from '../../models/user.model.js';
import { signToken } from '../../utils/jwt.utils.js';
import { validationResult } from 'express-validator';

const SALT_ROUNDS = 12;

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password, username } = req.body;

    const existing = await UserModel.findByEmail(email);
    if (existing)
      return res.status(409).json({ message: 'Email déjà utilisé' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await UserModel.create({ email, passwordHash, username });
    const token = signToken(user.id);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user)
      return res.status(401).json({ message: 'Identifiants invalides' });

    if (user.provider !== 'local')
      return res.status(401).json({ message: 'Connectez-vous via Google' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ message: 'Identifiants invalides' });

    const token = signToken(user.id);
    const { password_hash, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me  (route protégée)
export const getMe = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};