import { verifyToken } from '../utils/jwt.utils.js';
import { UserModel } from '../models/user.model.js';
import { TokenBlacklistModel } from '../models/tokenBlacklist.model.js';

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant.' });
    }

    const token = header.split(' ')[1];

    const decoded = verifyToken(token);

    if (await TokenBlacklistModel.has(token)) {
      return res.status(401).json({ message: 'Token révoqué.' });
    }

    // 🔥 sub = userId
    const user = await UserModel.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }

    if (user.is_banned) {
      return res.status(403).json({ message: 'Compte suspendu.' });
    }

    req.user = {
      userId: user.id,  
      email: user.email,
      roles: decoded.roles || [],
      token,
      tokenExpiresAt: decoded.exp ? new Date(decoded.exp * 1000) : null,
    };

    next();

  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
};

export const optionalProtect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      return next();
    }

    const token = header.split(' ')[1];
    const decoded = verifyToken(token);
    const user = await UserModel.findById(decoded.sub);

    if (!user || user.is_banned) {
      return next();
    }

    req.user = {
      userId: user.id,
      email: user.email,
      roles: decoded.roles || [],
    };

    return next();
  } catch (err) {
    return next();
  }
};

