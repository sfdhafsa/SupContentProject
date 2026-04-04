import { verifyToken } from '../utils/jwt.utils.js';
import { UserModel } from '../models/user.model.js';

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ message: 'Token manquant.' });

    const token = header.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await UserModel.findById(decoded.sub);
    if (!user)
      return res.status(401).json({ message: 'Utilisateur introuvable.' });

    if (user.is_banned)
      return res.status(403).json({ message: 'Ce compte a été suspendu.' });

    req.user = user;
    next();
  } catch (err) {
    // jwt expired ou signature invalide
    res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
};

// Middleware rôle — ex: requireRole('ADMIN')
export const requireRole = (role) => (req, res, next) => {
  if (!req.user?.roles?.includes(role))
    return res.status(403).json({ message: 'Accès refusé.' });
  next();
};