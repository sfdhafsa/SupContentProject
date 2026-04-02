import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import { UserModel } from '../../models/user.model.js';
import { signToken } from '../../utils/jwt.utils.js';

const SALT_ROUNDS = 12;

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, username, password } = req.body;

    const existingEmail = await UserModel.findByEmail(email);
    if (existingEmail)
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });

    const existingUsername = await UserModel.findByUsername(username);
    if (existingUsername)
      return res.status(409).json({ message: 'Ce nom d\'utilisateur est déjà pris.' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await UserModel.createLocal({ email, username, passwordHash });
    const token = signToken(user.id);

    res.status(201).json({
      message: 'Compte créé avec succès.',
      token,
      user: { id: user.id, email: user.email, username: user.username },
    });
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

    // 1. Trouver le user
    const user = await UserModel.findByEmail(email);

    // 2. Message volontairement générique (ne pas révéler si l'email existe)
    if (!user || !user.password_hash)
      return res.status(401).json({ message: 'Identifiants invalides.' });

    // 3. Vérifier si le compte est banni
    if (user.is_banned)
      return res.status(403).json({ message: 'Ce compte a été suspendu.' });

    // 4. Comparer le mot de passe
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ message: 'Identifiants invalides.' });

    // 5. Générer le token
    const token = signToken(user.id);

    // 6. Récupérer le user complet avec ses rôles (sans password_hash)
    const fullUser = await UserModel.findById(user.id);

    res.json({
      message: 'Connexion réussie.',
      token,
      user: fullUser,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me  — route protégée
export const getMe = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user)
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};