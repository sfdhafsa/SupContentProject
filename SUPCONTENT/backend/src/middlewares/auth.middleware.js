import { verifyToken } from '../utils/jwt.utils.js';
import { UserModel } from '../models/user.model.js';

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    console.log("AUTH HEADER =>", req.headers.authorization);

    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token manquant.' });
    }

    const token = header.split(' ')[1];

    const decoded = verifyToken(token);

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
      roles: decoded.roles || [] 
    };

    next();

  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
};